import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np

from src.data_loader import load_dataset
from src.dataset import Vocab, EssayDataset
from src.deep_model import EssayCNNBiLSTM

def evaluate_model(model, data_loader, device):
    model.eval()
    preds, actuals = [], []
    with torch.no_grad():
        for essays, scores in data_loader:
            essays, scores = essays.to(device), scores.to(device)
            outputs = model(essays)
            preds.extend(outputs.cpu().numpy())
            actuals.extend(scores.cpu().numpy())
    preds = np.array(preds)
    actuals = np.array(actuals)
    rmse = np.sqrt(np.mean((preds - actuals) ** 2))
    mae = np.mean(np.abs(preds - actuals))
    
    # Calculate accuracy metrics (percentage within threshold)
    errors = np.abs(preds - actuals)
    accuracy_5 = np.mean(errors <= 5) * 100  # Within 5 points
    accuracy_10 = np.mean(errors <= 10) * 100  # Within 10 points
    accuracy_15 = np.mean(errors <= 15) * 100  # Within 15 points
    
    return rmse, mae, accuracy_5, accuracy_10, accuracy_15, preds, actuals

def main():
    data_path = "data/training_set_rel3.tsv"
    model_path = "models/deep_essay_grader.pt"

    # Load validation data
    _, X_val, _, y_val = load_dataset(data_path)

    # Load checkpoint
    checkpoint = torch.load(model_path, map_location=torch.device("cpu"))
    vocab_dict = checkpoint["vocab"]

    # Rebuild vocab
    vocab = Vocab()
    vocab.word2idx = vocab_dict
    vocab.idx2word = {idx: word for word, idx in vocab_dict.items()}

    # Create validation dataset
    val_dataset = EssayDataset(X_val, y_val, vocab, max_len=300)
    val_loader = DataLoader(val_dataset, batch_size=32)

    # Rebuild model
    model = EssayCNNBiLSTM(vocab_size=len(vocab), embed_dim=128, hidden_dim=128, num_layers=1)
    model.load_state_dict(checkpoint["model_state"])
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Evaluate
    rmse, mae, acc_5, acc_10, acc_15, preds, actuals = evaluate_model(model, val_loader, device)
    
    print("\n" + "="*60)
    print("MODEL EVALUATION RESULTS")
    print("="*60)
    print(f"RMSE (Root Mean Squared Error): {rmse:.4f}")
    print(f"MAE (Mean Absolute Error): {mae:.4f}")
    print(f"\nAccuracy Metrics:")
    print(f"  Within 5 points:  {acc_5:.2f}%")
    print(f"  Within 10 points: {acc_10:.2f}%")
    print(f"  Within 15 points: {acc_15:.2f}%")
    print("="*60)
    
    # Show some sample predictions
    print("\nSample Predictions (first 10):")
    for i in range(min(10, len(preds))):
        error = abs(preds[i] - actuals[i])
        print(f"Essay {i+1}: Predicted={preds[i]:.2f}, Actual={actuals[i]:.2f}, Error={error:.2f}")

if __name__ == "__main__":
    main()
