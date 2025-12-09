import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

from src.data_loader import load_dataset
from src.dataset import Vocab, EssayDataset
from src.deep_model import EssayCNNBiLSTM

def train_model(model, train_loader, val_loader, device, epochs=3, lr=2e-3):
    criterion = nn.MSELoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    model.to(device)
    best_val_loss = float('inf')
    patience_counter = 0

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for essays, scores in train_loader:
            essays, scores = essays.to(device), scores.to(device)

            optimizer.zero_grad()
            outputs = model(essays)
            loss = criterion(outputs, scores)
            loss.backward()
            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            total_loss += loss.item()

        avg_train_loss = total_loss / len(train_loader)

        # Validation
        model.eval()
        val_loss = 0
        all_preds = []
        all_scores = []
        with torch.no_grad():
            for essays, scores in val_loader:
                essays, scores = essays.to(device), scores.to(device)
                outputs = model(essays)
                loss = criterion(outputs, scores)
                val_loss += loss.item()
                all_preds.extend(outputs.cpu().numpy())
                all_scores.extend(scores.cpu().numpy())

        avg_val_loss = val_loss / len(val_loader)
        
        # Calculate metrics
        rmse = np.sqrt(mean_squared_error(all_scores, all_preds))
        mae = mean_absolute_error(all_scores, all_preds)
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | RMSE: {rmse:.4f} | MAE: {mae:.4f}")
        
        # Learning rate scheduling
        scheduler.step(avg_val_loss)
        
        # Early stopping (but with small patience to keep training fast)
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= 2:  # Early stop after 2 epochs without improvement
                print("Early stopping triggered.")
                break

    return model

def main():
    data_path = "data/training_set_rel3.tsv"
    model_path = "models/deep_essay_grader.pt"

    # 1. Load dataset
    print("Loading dataset...")
    X_train, X_val, y_train, y_val = load_dataset(data_path)
    print(f"Train samples: {len(X_train)}, Val samples: {len(X_val)}")

    # 2. Build vocab
    print("Building vocabulary...")
    vocab = Vocab(min_freq=2)
    vocab.build_vocab(X_train)
    print(f"Vocabulary size: {len(vocab)}")

    # 3. Create datasets
    train_dataset = EssayDataset(X_train, y_train, vocab, max_len=300)
    val_dataset = EssayDataset(X_val, y_val, vocab, max_len=300)

    # 4. DataLoaders - increased batch size for faster training
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=64, num_workers=0)

    # 5. Initialize model - improved architecture
    model = EssayCNNBiLSTM(
        vocab_size=len(vocab), 
        embed_dim=128, 
        hidden_dim=128, 
        num_layers=1,  # Single layer for faster training
        dropout=0.3
    )
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Model parameters: {total_params:,} (trainable: {trainable_params:,})")

    # 6. Train
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    model = train_model(model, train_loader, val_loader, device, epochs=3, lr=2e-3)

    # 7. Save model + vocab
    os.makedirs("models", exist_ok=True)
    torch.save({"model_state": model.state_dict(), "vocab": vocab.word2idx}, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    main()
