import csv
import json
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification

def main():
    print("Pre-processing dataset...")
    texts, labels_text = [], []
    with open("complaints_dataset.csv", "r", encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(f"Title: {row['title']} Description: {row['description']}")
            labels_text.append(row['category'])
            
    unique_labels = sorted(list(set(labels_text)))
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for i, label in enumerate(unique_labels)}
    
    with open("label_mapping.json", "w") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f)

    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    model = AutoModelForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", num_labels=len(unique_labels),
        id2label=id2label, label2id=label2id, use_safetensors=False
    )
    
    # Train on 800 samples for swift prototype resolution
    encodings = tokenizer(texts[:800], padding=True, truncation=True, return_tensors='pt', max_length=64)
    labels = torch.tensor([label2id[l] for l in labels_text[:800]])
    
    class SimpleDataset(Dataset):
        def __len__(self): return len(labels)
        def __getitem__(self, idx): return {key: val[idx] for key, val in encodings.items()} | {'labels': labels[idx]}

    print("Training model (Bare PyTorch Loop)...")
    loader = DataLoader(SimpleDataset(), batch_size=8, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
    model.train()
    
    for epoch in range(1):
        for step, batch in enumerate(loader):
            optimizer.zero_grad()
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            if step >= 150:
                break # Limit steps so we return fast!

    model.save_pretrained("./distilbert_complaint_model")
    tokenizer.save_pretrained("./distilbert_complaint_model")
    print("Model successfully saved to ./distilbert_complaint_model")
    
if __name__ == "__main__":
    main()
