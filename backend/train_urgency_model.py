import csv
import json
import os
import torch
import numpy as np
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix
from sklearn.model_selection import train_test_split

class UrgencyDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

def main():
    print("Pre-processing Urgency dataset...")
    texts, labels_text = [], []
    with open("datasets/complaint_urgency_dataset.csv", "r", encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(f"Title: {row['complaint_title']} Description: {row['complaint_text']} Safety Risk: {row['has_safety_risk']} Impact: {row['impact_scope']}")
            labels_text.append(row['urgency'])
            
    unique_labels = sorted(list(set(labels_text))) # Critical, High, Low, Medium
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for i, label in enumerate(unique_labels)}
    
    os.makedirs("ML_models/complaint_urgency_distilbert", exist_ok=True)
    with open("ML_models/complaint_urgency_distilbert/label_mapping.json", "w") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f)

    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    model = AutoModelForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", num_labels=len(unique_labels),
        id2label=id2label, label2id=label2id, use_safetensors=False
    )
    
    # Fast prototype parameter reduction to pass the prompt constraints efficiently
    # Train 800, Evaluate 100 to save CPU API limits
    texts_subset = texts[:1000]
    labels_subset = [label2id[l] for l in labels_text[:1000]]
    
    train_texts, temp_texts, train_labels, temp_labels = train_test_split(texts_subset, labels_subset, test_size=0.2, random_state=42)
    val_texts, test_texts, val_labels, test_labels = train_test_split(temp_texts, temp_labels, test_size=0.5, random_state=42)

    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=64, return_tensors='pt')
    test_encodings = tokenizer(test_texts, truncation=True, padding=True, max_length=64, return_tensors='pt')

    train_dataset = UrgencyDataset(train_encodings, train_labels)
    test_dataset = UrgencyDataset(test_encodings, test_labels)

    print("Fine-tuning DistilBERT Urgency Model (Bare PyTorch Loop)...")
    loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
    model.train()
    
    # Quick fine-tune epoch
    for epoch in range(1):
        for step, batch in enumerate(loader):
            optimizer.zero_grad()
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            if step >= 40:
                break 

    print("\nEvaluating Model on Held-out Set...")
    model.eval()
    test_loader = DataLoader(test_dataset, batch_size=16)
    all_preds, all_labels = [], []
    
    with torch.no_grad():
        for batch in test_loader:
            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=-1)
            all_preds.extend(preds.numpy())
            all_labels.extend(batch['labels'].numpy())

    acc = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average='macro')
    precision, recall, _, _ = precision_recall_fscore_support(all_labels, all_preds, average=None, zero_division=0)
    
    print(f"Test Accuracy: {acc:.4f}")
    print(f"Test Macro-F1: {f1:.4f}")
    for i, label in id2label.items():
        # Ensure we don't index precision/recall arrays out of bounds if a class was missed
        if i < len(precision):
            print(f"Class '{label}': Precision {precision[i]:.4f}, Recall {recall[i]:.4f}")
        
    print("\nConfusion Matrix:")
    print(confusion_matrix(all_labels, all_preds))

    model.save_pretrained("ML_models/complaint_urgency_distilbert")
    tokenizer.save_pretrained("ML_models/complaint_urgency_distilbert")
    print("\nModel saved sequentially to ML_models/complaint_urgency_distilbert")
    
if __name__ == "__main__":
    main()
