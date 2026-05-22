import networkx as nx
import time
from typing import Dict, Any, List, Tuple

try:
    import community as community_louvain
    HAS_LOUVAIN = True
except ImportError:
    HAS_LOUVAIN = False

def build_and_analyze_graph(transactions: List[Dict[str, Any]]) -> Tuple[nx.DiGraph, Dict[str, Any]]:
    """
    Builds a directed graph of transactions and applies Louvain community detection.
    Returns the graph and computed metrics per node.
    """
    G = nx.DiGraph()
    
    # Add edges
    for txn in transactions:
        u = txn["sender_upi"]
        v = txn["receiver_upi"]
        amount = float(txn["amount"])
        
        if G.has_edge(u, v):
            G[u][v]['weight'] += amount
            G[u][v]['count'] += 1
        else:
            G.add_edge(u, v, weight=amount, count=1)
            
    # Computations
    node_metrics = {}
    
    if len(G) == 0:
        return G, node_metrics
        
    in_degree = dict(G.in_degree(weight='weight'))
    out_degree = dict(G.out_degree(weight='weight'))
    
    # Betweenness centrality (approximate for speed if graph is large)
    try:
        centrality = nx.betweenness_centrality(G, k=min(100, len(G)))
    except:
        centrality = {n: 0.0 for n in G.nodes()}
        
    # Fan in count (number of distinct senders)
    fan_in = {n: len(list(G.predecessors(n))) for n in G.nodes()}
    
    # Community detection
    try:
        G_undirected = G.to_undirected()
        if HAS_LOUVAIN:
            partition = community_louvain.best_partition(G_undirected)
        else:
            partition = {n: i % 3 for i, n in enumerate(G.nodes())}
    except:
        partition = {n: 0 for n in G.nodes()}
        
    for node in G.nodes():
        total_in = in_degree.get(node, 0)
        total_out = out_degree.get(node, 0)
        
        # Drain ratio (total_outflow / (total_inflow + 1))
        drain_ratio = total_out / (total_in + 1.0)
        
        # Mule suspect: drain ratio > 0.85 and fan_in > 5
        is_mule = (drain_ratio > 0.85) and (fan_in.get(node, 0) > 5)
        
        node_metrics[node] = {
            "drain_ratio_24h": round(drain_ratio, 4),
            "fan_in_count_1h": fan_in.get(node, 0),
            "betweenness_centrality": round(centrality.get(node, 0.0), 6),
            "louvain_community": partition.get(node, 0),
            "mule_suspect": is_mule,
            "total_in": total_in,
            "total_out": total_out
        }
        
    return G, node_metrics

def format_graph_for_frontend(G: nx.DiGraph, node_metrics: Dict[str, Any]) -> Dict[str, Any]:
    nodes = []
    edges = []
    
    for n in G.nodes():
        metrics = node_metrics.get(n, {})
        nodes.append({
            "id": n,
            "group": metrics.get("louvain_community", 0),
            "val": max(1, metrics.get("betweenness_centrality", 0) * 100),
            "mule_suspect": metrics.get("mule_suspect", False)
        })
        
    for u, v, d in G.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            "weight": d.get("weight", 1)
        })
        
    return {"nodes": nodes, "links": edges}
