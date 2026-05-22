from typing import Dict, Any, List

TEMPLATES_EN = {
    "amount_vs_7d_avg": "User's typical daily spend is much lower; this transfer is significantly higher than normal.",
    "new_device_flag": "Transaction originated from an unrecognized device.",
    "is_new_beneficiary": "Beneficiary was added very recently.",
    "graph_contagion_score": "Destination account is linked to flagged accounts in the transaction network.",
    "is_night": "Transfer sent late at night, outside the user's normal activity window.",
    "location_change_flag": "Transaction initiated from a location far from the user's home.",
    "amount_zscore_peer_group": "Amount is unusually high compared to similar users in this demographic."
}

TEMPLATES_HI = {
    "amount_vs_7d_avg": "उपयोगकर्ता का सामान्य दैनिक खर्च बहुत कम है; यह ट्रांसफर सामान्य से काफी अधिक है।",
    "new_device_flag": "लेनदेन एक अज्ञात डिवाइस से शुरू किया गया था।",
    "is_new_beneficiary": "लाभार्थी को बहुत हाल ही में जोड़ा गया था।",
    "graph_contagion_score": "गंतव्य खाता लेनदेन नेटवर्क में संदिग्ध खातों से जुड़ा हुआ है।",
    "is_night": "ट्रांसफर देर रात भेजा गया, जो उपयोगकर्ता की सामान्य गतिविधि के समय से बाहर है।",
    "location_change_flag": "उपयोगकर्ता के घर से दूर एक स्थान से लेनदेन शुरू किया गया।",
    "amount_zscore_peer_group": "इस जनसांख्यिकीय में समान उपयोगकर्ताओं की तुलना में राशि असामान्य रूप से अधिक है।"
}

def generate_explanation(txn: Dict[str, Any], shap_features: List[Dict[str, Any]], fraud_template: str = None) -> Dict[str, str]:
    en_sentences = []
    hi_sentences = []
    
    # Process top 3 SHAP features
    for f in shap_features[:3]:
        fname = f["feature"]
        if fname in TEMPLATES_EN:
            en_sentences.append(TEMPLATES_EN[fname])
        if fname in TEMPLATES_HI:
            hi_sentences.append(TEMPLATES_HI[fname])
            
    if not en_sentences:
        en_sentences.append("Transaction exhibits unusual velocity or amount patterns.")
        hi_sentences.append("लेनदेन में असामान्य पैटर्न दिखाई देता है।")
        
    en_text = " ".join(en_sentences)
    hi_text = " ".join(hi_sentences)
    
    if fraud_template:
        en_text += f" Pattern matches: {fraud_template.replace('_', ' ')}."
        hi_text += f" पैटर्न मेल खाता है: {fraud_template.replace('_', ' ')}."
        
    return {
        "en": en_text,
        "hi": hi_text
    }
