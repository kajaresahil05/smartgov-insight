import csv
import json
import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix

def main():
    print("Loading 5,000-record dataset...")
    df = pd.read_csv("datasets/complaints_dataset.csv")
    
    # Stratified Split: 80% train, 10% val, 10% test
    # Combine title and text consistently 
    df['combined_text'] = "Title: " + df['title'] + " Description: " + df['complaint_text']
    
    unique_labels = sorted(df['category'].unique())
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for i, label in enumerate(unique_labels)}
    
    df['label'] = df['category'].map(label2id)
    
    X = df['combined_text']
    y = df['label']
    
    # 80/20 train/temp
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    # Split temp into Val(50%) and Test(50%) -> 10% of total each
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
    
    print("Training ML Models...")
    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)
    X_test_vec = vectorizer.transform(X_test)
    
    # Compare Logistic Regression and LinearSVC
    log_reg = LogisticRegression(max_iter=1000)
    log_reg.fit(X_train_vec, y_train)
    
    svc = LinearSVC(C=1.0)
    calibrated_svc = CalibratedClassifierCV(svc, method='sigmoid', cv=3)
    calibrated_svc.fit(X_train_vec, y_train)
    
    # Validation Performance
    lr_preds = log_reg.predict(X_val_vec)
    svc_preds = calibrated_svc.predict(X_val_vec)
    
    print(f"Logistic Regression Validation Accuracy: {accuracy_score(y_val, lr_preds):.4f}")
    print(f"LinearSVC Validation Accuracy: {accuracy_score(y_val, svc_preds):.4f}")
    
    # We choose Calibrated LinearSVC naturally if it matches or performs well on sparse textual classes
    best_model = calibrated_svc if accuracy_score(y_val, svc_preds) >= accuracy_score(y_val, lr_preds) else log_reg
    
    # Real Testing on hold-out set
    print("\n--- Evaluating Best Model on Held-out TEST Set (10%) ---")
    test_preds = best_model.predict(X_test_vec)
    acc = accuracy_score(y_test, test_preds)
    f1 = f1_score(y_test, test_preds, average='macro')
    precision, recall, _, _ = precision_recall_fscore_support(y_test, test_preds, average=None)
    
    print(f"Test Accuracy: {acc:.4f}")
    print(f"Test Macro-F1: {f1:.4f}")
    
    for i, label in id2label.items():
        print(f"Class '{label}': Precision {precision[i]:.4f}, Recall {recall[i]:.4f}")
        
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, test_preds))
    
    # Save the selected Model and Vectorizer Artifacts
    os.makedirs("ML_models", exist_ok=True)
    joblib.dump(best_model, "ML_models/complaint_classifier.joblib")
    joblib.dump(vectorizer, "ML_models/tfidf_vectorizer.joblib")
    
    with open("ML_models/label_mapping.json", "w") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f)
        
    print("\nModel Artifacts saved to ML_models/")
    
if __name__ == "__main__":
    main()
