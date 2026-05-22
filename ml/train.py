"""
DRISHTI — LightGBM Model Training Pipeline
============================================

Trains a LightGBM binary classifier for UPI fraud detection.
Reads:   ml/data/transactions_features.csv
Exports: backend/models/lgbm_model.pkl
         backend/data/peer_cohorts.json

Target metrics:
  - AUC-ROC >= 0.92
  - F1 >= 0.82
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    auc,
    classification_report,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, train_test_split

warnings.filterwarnings("ignore", category=UserWarning)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR: Path = Path(__file__).resolve().parent / "data"
INPUT_FILE: Path = DATA_DIR / "transactions_features.csv"
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent
MODEL_DIR: Path = PROJECT_ROOT / "backend" / "models"
DATA_EXPORT_DIR: Path = PROJECT_ROOT / "backend" / "data"
MODEL_FILE: Path = MODEL_DIR / "lgbm_model.pkl"
COHORT_FILE: Path = DATA_EXPORT_DIR / "peer_cohorts.json"

SEED: int = 42

# Features to exclude from training
EXCLUDE_COLS: set[str] = {
    "txn_id", "timestamp", "sender_upi_id", "sender_name", "sender_user_id",
    "beneficiary_upi_id", "currency", "device_id", "city",
    "is_fraud", "fraud_type", "cohort", "mcc_code",
}

# LightGBM hyperparameters
LGBM_PARAMS: dict[str, Any] = {
    "objective": "binary",
    "metric": "auc",
    "num_leaves": 63,
    "learning_rate": 0.05,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 5,
    "is_unbalance": True,
    "verbose": -1,
    "n_jobs": -1,
    "random_state": SEED,
    "min_child_samples": 20,
    "reg_alpha": 0.1,
    "reg_lambda": 0.1,
    "max_depth": -1,
}
N_ESTIMATORS: int = 500


def load_data() -> tuple[pd.DataFrame, list[str]]:
    """Load feature-engineered data and identify feature columns."""
    print("  Loading feature data...")
    df = pd.read_csv(INPUT_FILE)
    print(f"  Loaded {len(df):,} transactions")

    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]
    print(f"  Using {len(feature_cols)} features for training")

    return df, feature_cols


def prepare_data(
    df: pd.DataFrame,
    feature_cols: list[str],
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list[str]]:
    """Prepare train/test split with SMOTE oversampling."""
    print("\n  Preparing data...")

    X = df[feature_cols].copy()

    # Encode categorical-like string columns if any remain
    for col in X.select_dtypes(include=["object"]).columns:
        X[col] = X[col].astype("category").cat.codes

    # Handle infinities and NaNs
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.fillna(0)

    y = df["is_fraud"].values

    print(f"  Class distribution: fraud={y.sum():,}, legit={(y==0).sum():,}")
    print(f"  Fraud rate: {y.mean()*100:.2f}%")

    # Stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X.values, y, test_size=0.2, random_state=SEED, stratify=y
    )

    print(f"  Train: {len(X_train):,} | Test: {len(X_test):,}")

    # SMOTE oversampling on training set
    print("  Applying SMOTE oversampling...")
    smote = SMOTE(random_state=SEED, sampling_strategy=0.3)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
    print(f"  After SMOTE - Train: {len(X_train_resampled):,}")
    print(f"    fraud={y_train_resampled.sum():,}, legit={(y_train_resampled==0).sum():,}")

    return X_train_resampled, X_test, y_train_resampled, y_test, list(X.columns)


def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: list[str],
) -> lgb.LGBMClassifier:
    """Train LightGBM classifier."""
    print("\n  Training LightGBM model...")
    print(f"  Hyperparameters:")
    for k, v in LGBM_PARAMS.items():
        print(f"    {k}: {v}")
    print(f"  n_estimators: {N_ESTIMATORS}")

    model = lgb.LGBMClassifier(
        n_estimators=N_ESTIMATORS,
        **LGBM_PARAMS,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        eval_metric="auc",
        callbacks=[
            lgb.log_evaluation(period=100),
            lgb.early_stopping(stopping_rounds=50, verbose=True),
        ],
        feature_name=feature_names,
    )

    print(f"  Best iteration: {model.best_iteration_}")
    return model


def evaluate_model(
    model: lgb.LGBMClassifier,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: list[str],
) -> dict[str, float]:
    """Evaluate model and print comprehensive metrics."""
    print("\n" + "=" * 60)
    print("MODEL EVALUATION RESULTS")
    print("=" * 60)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    # Core metrics
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc_roc = roc_auc_score(y_test, y_pred_proba)

    # Precision-Recall AUC
    prec_curve, rec_curve, _ = precision_recall_curve(y_test, y_pred_proba)
    pr_auc = auc(rec_curve, prec_curve)

    metrics = {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "auc_roc": round(auc_roc, 4),
        "pr_auc": round(pr_auc, 4),
    }

    print(f"\n  Precision  : {precision:.4f}")
    print(f"  Recall     : {recall:.4f}")
    print(f"  F1 Score   : {f1:.4f}")
    print(f"  AUC-ROC    : {auc_roc:.4f}")
    print(f"  PR-AUC     : {pr_auc:.4f}")

    # Target check
    print(f"\n  Target Checks:")
    auc_pass = "✓ PASS" if auc_roc >= 0.92 else "✗ FAIL"
    f1_pass = "✓ PASS" if f1 >= 0.82 else "✗ FAIL"
    print(f"    AUC-ROC >= 0.92 : {auc_pass} ({auc_roc:.4f})")
    print(f"    F1 >= 0.82      : {f1_pass} ({f1:.4f})")

    # Classification report
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))

    # Feature importance
    print("  Top 20 Features by Importance:")
    importance = model.feature_importances_
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importance,
    }).sort_values("importance", ascending=False)

    for i, row in importance_df.head(20).iterrows():
        print(f"    {row['feature']:35s}: {row['importance']:6d}")

    return metrics


def compute_shap_values(
    model: lgb.LGBMClassifier,
    X_test: np.ndarray,
    feature_names: list[str],
) -> None:
    """Compute and display SHAP values for model explainability."""
    print("\n  Computing SHAP values...")
    try:
        import shap

        explainer = shap.TreeExplainer(model)
        # Use a sample for speed
        sample_size = min(500, len(X_test))
        X_sample = X_test[:sample_size]
        shap_values = explainer.shap_values(X_sample)

        # For binary classification, shap_values might be a list
        if isinstance(shap_values, list):
            shap_vals = shap_values[1]  # Positive class
        else:
            shap_vals = shap_values

        mean_abs_shap = np.abs(shap_vals).mean(axis=0)
        shap_df = pd.DataFrame({
            "feature": feature_names,
            "mean_abs_shap": mean_abs_shap,
        }).sort_values("mean_abs_shap", ascending=False)

        print("\n  Top 15 Features by SHAP Value:")
        for _, row in shap_df.head(15).iterrows():
            print(f"    {row['feature']:35s}: {row['mean_abs_shap']:.4f}")

    except Exception as e:
        print(f"  SHAP computation skipped: {e}")


def build_peer_cohorts(df: pd.DataFrame, feature_cols: list[str]) -> dict[str, Any]:
    """Build peer cohort definitions for runtime scoring."""
    print("\n  Building peer cohort definitions...")

    cohort_defs: dict[str, Any] = {}
    for cohort, group in df.groupby("cohort"):
        stats: dict[str, Any] = {
            "count": int(len(group)),
            "amount_mean": round(float(group["amount"].mean()), 2),
            "amount_std": round(float(group["amount"].std()), 2),
            "amount_median": round(float(group["amount"].median()), 2),
            "amount_p95": round(float(group["amount"].quantile(0.95)), 2),
            "amount_p99": round(float(group["amount"].quantile(0.99)), 2),
            "fraud_rate": round(float(group["is_fraud"].mean()), 4),
        }

        # Feature means for z-score computation at inference
        feature_stats: dict[str, dict[str, float]] = {}
        for col in feature_cols:
            if col in group.columns and pd.api.types.is_numeric_dtype(group[col]):
                feature_stats[col] = {
                    "mean": round(float(group[col].mean()), 4),
                    "std": round(float(group[col].std()), 4),
                }
        stats["feature_stats"] = feature_stats

        cohort_defs[str(cohort)] = stats

    print(f"  Built {len(cohort_defs)} cohort profiles")
    for name, info in cohort_defs.items():
        print(f"    {name:12s}: n={info['count']:,}, avg_amt=₹{info['amount_mean']:,.2f}, "
              f"fraud_rate={info['fraud_rate']*100:.2f}%")

    return cohort_defs


def export_model(
    model: lgb.LGBMClassifier,
    feature_names: list[str],
    metrics: dict[str, float],
) -> None:
    """Export trained model to pickle."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    model_artifact = {
        "model": model,
        "feature_names": feature_names,
        "metrics": metrics,
        "version": "1.0.0",
        "framework": "lightgbm",
    }

    joblib.dump(model_artifact, MODEL_FILE)
    print(f"\n✓ Model exported to {MODEL_FILE}")
    print(f"  File size: {MODEL_FILE.stat().st_size / (1024*1024):.2f} MB")


def export_cohorts(cohort_defs: dict[str, Any]) -> None:
    """Export peer cohort definitions to JSON."""
    DATA_EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    with open(COHORT_FILE, "w", encoding="utf-8") as f:
        json.dump(cohort_defs, f, indent=2, ensure_ascii=False)

    print(f"✓ Peer cohorts exported to {COHORT_FILE}")


def cross_validate(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: list[str],
) -> None:
    """Run stratified k-fold cross-validation."""
    print("\n  Running 5-fold stratified cross-validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    fold_metrics: list[dict[str, float]] = []
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_tr, X_val = X[train_idx], X[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]

        model = lgb.LGBMClassifier(n_estimators=200, **LGBM_PARAMS)
        model.fit(
            X_tr, y_tr,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.log_evaluation(period=0), lgb.early_stopping(30, verbose=False)],
            feature_name=feature_names,
        )

        y_pred_proba = model.predict_proba(X_val)[:, 1]
        y_pred = model.predict(X_val)

        fold_auc = roc_auc_score(y_val, y_pred_proba)
        fold_f1 = f1_score(y_val, y_pred)
        fold_metrics.append({"auc": fold_auc, "f1": fold_f1})
        print(f"    Fold {fold}: AUC={fold_auc:.4f}, F1={fold_f1:.4f}")

    avg_auc = np.mean([m["auc"] for m in fold_metrics])
    avg_f1 = np.mean([m["f1"] for m in fold_metrics])
    std_auc = np.std([m["auc"] for m in fold_metrics])
    std_f1 = np.std([m["f1"] for m in fold_metrics])
    print(f"\n  CV Average: AUC={avg_auc:.4f} ± {std_auc:.4f}, F1={avg_f1:.4f} ± {std_f1:.4f}")


def main() -> None:
    """Main training pipeline."""
    print("=" * 60)
    print("DRISHTI — LightGBM Model Training Pipeline")
    print("=" * 60)

    # Load data
    df, feature_cols = load_data()

    # Prepare data with SMOTE
    X_train, X_test, y_train, y_test, feature_names = prepare_data(df, feature_cols)

    # Cross-validation (on original pre-SMOTE data for honest estimate)
    print("\n[1/5] Cross-validation on original data...")
    X_all = df[feature_cols].copy()
    for col in X_all.select_dtypes(include=["object"]).columns:
        X_all[col] = X_all[col].astype("category").cat.codes
    X_all = X_all.replace([np.inf, -np.inf], np.nan).fillna(0)
    y_all = df["is_fraud"].values
    cross_validate(X_all.values, y_all, feature_names)

    # Train final model
    print("\n[2/5] Training final model...")
    model = train_model(X_train, y_train, X_test, y_test, feature_names)

    # Evaluate
    print("\n[3/5] Evaluating model...")
    metrics = evaluate_model(model, X_test, y_test, feature_names)

    # SHAP
    print("\n[4/5] SHAP analysis...")
    compute_shap_values(model, X_test, feature_names)

    # Export
    print("\n[5/5] Exporting artifacts...")
    export_model(model, feature_names, metrics)

    cohort_defs = build_peer_cohorts(df, feature_cols)
    export_cohorts(cohort_defs)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Model:  {MODEL_FILE}")
    print(f"  Cohorts: {COHORT_FILE}")
    print(f"  Metrics: {metrics}")


if __name__ == "__main__":
    main()
