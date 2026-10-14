"""
Reproducible Training and Evaluation Pipeline for SmartGov Duplicate Complaint Detection (Model 3).
- Uses SentenceTransformer embeddings with fine-tuning on civic complaint pairs.
- Implements strict group-aware splitting to prevent data leakage across splits.
- Uses native PyTorch training loop with AdamW and CosineSimilarityLoss.
- Calibrates optimal cosine similarity threshold on validation data.
- Evaluates Precision, Recall, F1, FPR, and FNR on held-out test data.
- Saves model artifacts and evaluation metadata under ML_models/duplicate_complaint_detection/.
"""

import os
import json
import random
import time
import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses, util
from sklearn.metrics import precision_recall_fscore_support

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate geographic distance in meters between two lat/lon coordinates."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
    R = 6371000  # Earth radius in meters
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    a = np.sin(delta_phi / 2.0) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return float(R * c)

def build_pairs_from_split(df_split, max_pairs=3500):
    """
    Generate labeled complaint pairs from a given split:
    - Positive pairs: same duplicate_group_id (label 1.0)
    - Hard negative pairs: same category or location, different group (label 0.0)
    - Random negative pairs: different categories (label 0.0)
    """
    pos_pairs = []
    groups = df_split.groupby("duplicate_group_id")
    for gid, group in groups:
        if len(group) >= 2:
            records = group.to_dict("records")
            for i in range(len(records)):
                for j in range(i + 1, len(records)):
                    t1 = f"{records[i]['complaint_title']}. {records[i]['complaint_text']}"
                    t2 = f"{records[j]['complaint_title']}. {records[j]['complaint_text']}"
                    pos_pairs.append({
                        "text1": t1,
                        "text2": t2,
                        "label": 1.0,
                        "pair_type": "positive_duplicate",
                        "lat1": records[i]["latitude"],
                        "lon1": records[i]["longitude"],
                        "lat2": records[j]["latitude"],
                        "lon2": records[j]["longitude"]
                    })
    
    num_pos = len(pos_pairs)
    neg_pairs = []
    all_records = df_split.to_dict("records")
    
    # 1. Hard negatives (same category, different group)
    by_category = df_split.groupby("category")
    for cat, cat_df in by_category:
        cat_recs = cat_df.to_dict("records")
        for _ in range(min(len(cat_recs), num_pos // 2)):
            r1, r2 = random.sample(cat_recs, 2)
            if r1["duplicate_group_id"] != r2["duplicate_group_id"]:
                t1 = f"{r1['complaint_title']}. {r1['complaint_text']}"
                t2 = f"{r2['complaint_title']}. {r2['complaint_text']}"
                neg_pairs.append({
                    "text1": t1,
                    "text2": t2,
                    "label": 0.0,
                    "pair_type": "hard_neg_same_cat",
                    "lat1": r1["latitude"],
                    "lon1": r1["longitude"],
                    "lat2": r2["latitude"],
                    "lon2": r2["longitude"]
                })
                
    # 2. Hard negatives (same location, different category)
    by_loc = df_split.groupby("location_id")
    for loc_id, loc_df in by_loc:
        if loc_id in ["LOC-UNKNOWN", "LOC-VAGUE"]:
            continue
        loc_recs = loc_df.to_dict("records")
        if len(loc_recs) >= 2:
            for _ in range(min(len(loc_recs), 30)):
                r1, r2 = random.sample(loc_recs, 2)
                if r1["duplicate_group_id"] != r2["duplicate_group_id"]:
                    t1 = f"{r1['complaint_title']}. {r1['complaint_text']}"
                    t2 = f"{r2['complaint_title']}. {r2['complaint_text']}"
                    neg_pairs.append({
                        "text1": t1,
                        "text2": t2,
                        "label": 0.0,
                        "pair_type": "hard_neg_same_loc",
                        "lat1": r1["latitude"],
                        "lon1": r1["longitude"],
                        "lat2": r2["latitude"],
                        "lon2": r2["longitude"]
                    })
                    
    # 3. Random negatives
    needed = max(num_pos - len(neg_pairs), num_pos // 2)
    for _ in range(needed):
        r1, r2 = random.sample(all_records, 2)
        if r1["duplicate_group_id"] != r2["duplicate_group_id"]:
            t1 = f"{r1['complaint_title']}. {r1['complaint_text']}"
            t2 = f"{r2['complaint_title']}. {r2['complaint_text']}"
            neg_pairs.append({
                "text1": t1,
                "text2": t2,
                "label": 0.0,
                "pair_type": "random_neg",
                "lat1": r1["latitude"],
                "lon1": r1["longitude"],
                "lat2": r2["latitude"],
                "lon2": r2["longitude"]
            })
            
    # Sample to balanced ratio
    if len(neg_pairs) > int(len(pos_pairs) * 1.2):
        neg_pairs = random.sample(neg_pairs, int(len(pos_pairs) * 1.2))
        
    pairs = pos_pairs + neg_pairs
    random.shuffle(pairs)
    if len(pairs) > max_pairs:
        pairs = pairs[:max_pairs]
    return pairs

def main():
    print("=" * 65)
    print("SMARTGOV INSIGHT - DUPLICATE COMPLAINT DETECTION (MODEL 3)")
    print("TRAINING & EVALUATION PIPELINE")
    print("=" * 65)
    
    data_path = os.path.join(os.path.dirname(__file__), "datasets", "duplicate_complaint_dataset.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {len(df)} records across {df['duplicate_group_id'].nunique()} unique groups.")
    
    # 1. GROUP-AWARE TRAIN / VAL / TEST SPLIT (70% Train, 15% Val, 15% Test)
    # Distinct duplicate_group_ids are partitioned so NO GROUP LEAKS across splits!
    unique_groups = list(df["duplicate_group_id"].unique())
    random.shuffle(unique_groups)
    
    n_groups = len(unique_groups)
    train_end = int(0.70 * n_groups)
    val_end = int(0.85 * n_groups)
    
    train_groups = set(unique_groups[:train_end])
    val_groups = set(unique_groups[train_end:val_end])
    test_groups = set(unique_groups[val_end:])
    
    # Strict assertions: zero group leakage
    assert len(train_groups.intersection(val_groups)) == 0, "Leakage between Train and Val!"
    assert len(train_groups.intersection(test_groups)) == 0, "Leakage between Train and Test!"
    assert len(val_groups.intersection(test_groups)) == 0, "Leakage between Val and Test!"
    
    df_train = df[df["duplicate_group_id"].isin(train_groups)].copy()
    df_val = df[df["duplicate_group_id"].isin(val_groups)].copy()
    df_test = df[df["duplicate_group_id"].isin(test_groups)].copy()
    
    print("\nSplit Statistics (Zero Group Leakage Partitioning):")
    print(f"  Train: {len(df_train):4d} records across {len(train_groups):4d} groups")
    print(f"  Val:   {len(df_val):4d} records across {len(val_groups):4d} groups")
    print(f"  Test:  {len(df_test):4d} records across {len(test_groups):4d} groups")
    
    # 2. GENERATE LABELED PAIRS FOR EACH SPLIT
    train_pairs = build_pairs_from_split(df_train, max_pairs=3200)
    val_pairs = build_pairs_from_split(df_val, max_pairs=800)
    test_pairs = build_pairs_from_split(df_test, max_pairs=800)
    
    print("\nGenerated Labeled Complaint Pairs:")
    print(f"  Train pairs: {len(train_pairs)} (Pos: {sum(1 for p in train_pairs if p['label'] == 1.0)}, Neg: {sum(1 for p in train_pairs if p['label'] == 0.0)})")
    print(f"  Val pairs:   {len(val_pairs)} (Pos: {sum(1 for p in val_pairs if p['label'] == 1.0)}, Neg: {sum(1 for p in val_pairs if p['label'] == 0.0)})")
    print(f"  Test pairs:  {len(test_pairs)} (Pos: {sum(1 for p in test_pairs if p['label'] == 1.0)}, Neg: {sum(1 for p in test_pairs if p['label'] == 0.0)})")
    
    # 3. INITIALIZE SENTENCE TRANSFORMER (all-MiniLM-L6-v2)
    base_model_name = "all-MiniLM-L6-v2"
    print(f"\nInitializing SentenceTransformer model: {base_model_name}")
    model = SentenceTransformer(base_model_name)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    
    # Convert training pairs to InputExamples
    train_examples = [
        InputExample(texts=[p["text1"], p["text2"]], label=float(p["label"]))
        for p in train_pairs
    ]
    train_dataloader = DataLoader(
        train_examples,
        shuffle=True,
        batch_size=32,
        collate_fn=model.smart_batching_collate
    )
    loss_fn = losses.CosineSimilarityLoss(model=model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    
    # 4. FINE-TUNE MODEL ON CIVIC COMPLAINT PAIRS USING PYTORCH LOOP
    print("\nFine-tuning model on civic domain duplicate complaint pairs (Native PyTorch AdamW)...")
    model.train()
    start_time = time.time()
    num_batches = len(train_dataloader)
    for batch_idx, (features, labels) in enumerate(train_dataloader):
        labels = labels.to(device)
        optimizer.zero_grad()
        loss = loss_fn(features, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        if (batch_idx + 1) % 25 == 0 or (batch_idx + 1) == num_batches:
            print(f"  Batch [{batch_idx+1}/{num_batches}] - Loss: {loss.item():.4f}")
            
    training_duration = time.time() - start_time
    print(f"Fine-tuning completed in {training_duration:.2f} seconds.")
    model.eval()
    
    # 5. THRESHOLD CALIBRATION ON VALIDATION SPLIT
    print("\nCalibrating semantic similarity threshold on Validation set...")
    val_texts1 = [p["text1"] for p in val_pairs]
    val_texts2 = [p["text2"] for p in val_pairs]
    val_labels = np.array([p["label"] for p in val_pairs])
    
    with torch.no_grad():
        val_emb1 = model.encode(val_texts1, batch_size=64, convert_to_tensor=True)
        val_emb2 = model.encode(val_texts2, batch_size=64, convert_to_tensor=True)
        val_sims = util.cos_sim(val_emb1, val_emb2)
        val_cos_scores = torch.diagonal(val_sims).cpu().numpy()
    
    best_threshold = 0.75
    best_f1 = 0.0
    best_val_metrics = {}
    
    threshold_range = np.arange(0.50, 0.95, 0.02)
    for thresh in threshold_range:
        preds = (val_cos_scores >= thresh).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(val_labels, preds, average="binary", zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = round(float(thresh), 2)
            best_val_metrics = {
                "threshold": best_threshold,
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "f1_score": round(float(f1), 4)
            }
            
    print(f"Calibrated Optimal Cosine Threshold: {best_threshold}")
    print(f"Validation Performance at {best_threshold}: Precision={best_val_metrics['precision']}, Recall={best_val_metrics['recall']}, F1={best_val_metrics['f1_score']}")
    
    # 6. EVALUATION ON HELD-OUT TEST SET
    print("\nEvaluating model on Held-Out Test Set (Zero Leakage)...")
    test_texts1 = [p["text1"] for p in test_pairs]
    test_texts2 = [p["text2"] for p in test_pairs]
    test_labels = np.array([p["label"] for p in test_pairs], dtype=int)
    
    with torch.no_grad():
        test_emb1 = model.encode(test_texts1, batch_size=64, convert_to_tensor=True)
        test_emb2 = model.encode(test_texts2, batch_size=64, convert_to_tensor=True)
        test_sims = util.cos_sim(test_emb1, test_emb2)
        test_cos_scores = torch.diagonal(test_sims).cpu().numpy()
    
    # Compute confusion matrix & key metrics
    test_preds = (test_cos_scores >= best_threshold).astype(int)
    tp = int(np.sum((test_preds == 1) & (test_labels == 1)))
    fp = int(np.sum((test_preds == 1) & (test_labels == 0)))
    tn = int(np.sum((test_preds == 0) & (test_labels == 0)))
    fn = int(np.sum((test_preds == 0) & (test_labels == 1)))
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    accuracy = (tp + tn) / len(test_labels) if len(test_labels) > 0 else 0.0
    
    print("-" * 50)
    print("TEST SET EVALUATION METRICS:")
    print("-" * 50)
    print(f"  Total Test Pairs:      {len(test_labels)}")
    print(f"  True Positives (TP):   {tp}")
    print(f"  False Positives (FP):  {fp}")
    print(f"  True Negatives (TN):   {tn}")
    print(f"  False Negatives (FN):  {fn}")
    print(f"  Accuracy:              {accuracy * 100:.2f}%")
    print(f"  Precision:             {precision * 100:.2f}%")
    print(f"  Recall:                {recall * 100:.2f}%")
    print(f"  F1 Score:              {f1 * 100:.2f}%")
    print(f"  False Positive Rate:   {fpr * 100:.2f}%")
    print(f"  False Negative Rate:   {fnr * 100:.2f}%")
    print("-" * 50)
    
    # 7. SPATIAL-SEMANTIC DECISION TEST ON KEY TEST CASES
    print("\nTesting Combined Spatial-Semantic Decision Logic:")
    case_results = {
        "Case A (Same Issue, Same Loc - Duplicate)": 0,
        "Case B (Same Issue, Diff Loc - Separate)": 0,
        "Case C (Diff Issue, Same Loc - Separate)": 0
    }
    
    with torch.no_grad():
        for p in test_pairs:
            dist = haversine_distance(p["lat1"], p["lon1"], p["lat2"], p["lon2"])
            t1_e = model.encode(p["text1"], convert_to_tensor=True)
            t2_e = model.encode(p["text2"], convert_to_tensor=True)
            sim = float(util.cos_sim(t1_e, t2_e)[0][0].cpu())
            
            if p["pair_type"] == "positive_duplicate":
                if dist <= 200 and sim >= best_threshold:
                    case_results["Case A (Same Issue, Same Loc - Duplicate)"] += 1
            elif p["pair_type"] == "hard_neg_same_cat":
                if dist > 500:
                    case_results["Case B (Same Issue, Diff Loc - Separate)"] += 1
            elif p["pair_type"] == "hard_neg_same_loc":
                if sim < best_threshold:
                    case_results["Case C (Diff Issue, Same Loc - Separate)"] += 1
                    
    print(f"  Verified Case A: {case_results['Case A (Same Issue, Same Loc - Duplicate)']} instances")
    print(f"  Verified Case B: {case_results['Case B (Same Issue, Diff Loc - Separate)']} instances")
    print(f"  Verified Case C: {case_results['Case C (Diff Issue, Same Loc - Separate)']} instances")
    
    # 8. SAVE ARTIFACTS IN ML_models/duplicate_complaint_detection/
    out_model_dir = os.path.join(os.path.dirname(__file__), "ML_models", "duplicate_complaint_detection")
    os.makedirs(out_model_dir, exist_ok=True)
    
    transformer_dir = os.path.join(out_model_dir, "sentence_transformer")
    print(f"\nSaving fine-tuned SentenceTransformer model to: {transformer_dir}")
    model.save(transformer_dir)
    
    metadata = {
        "model_name": "SmartGov Duplicate Complaint Detection Model (Model 3)",
        "base_architecture": "SentenceTransformer all-MiniLM-L6-v2",
        "training_method": "Contrastive Cosine Similarity Fine-Tuning with Group-Aware Zero-Leakage Split",
        "vector_dimensions": 384,
        "calibrated_cosine_threshold": best_threshold,
        "spatial_parameters": {
            "exact_duplicate_max_distance_meters": 150.0,
            "nearby_cluster_max_distance_meters": 500.0,
            "uncertain_similarity_range": [0.65, best_threshold]
        },
        "evaluation_metrics": {
            "test_sample_size": len(test_labels),
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "false_positive_rate": round(fpr, 4),
            "false_negative_rate": round(fnr, 4),
            "confusion_matrix": {"TP": tp, "FP": fp, "TN": tn, "FN": fn}
        },
        "validation_metrics": best_val_metrics,
        "training_duration_seconds": round(training_duration, 2),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    metadata_file = os.path.join(out_model_dir, "model_metadata.json")
    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata & calibration config to: {metadata_file}")
    
    print("\n" + "=" * 65)
    print("TRAINING & EVALUATION COMPLETED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    main()
