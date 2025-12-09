import torch
import torch.nn as nn
import torch.nn.functional as F

class AttentionPooling(nn.Module):
    """Attention mechanism for better pooling."""
    def __init__(self, hidden_dim):
        super(AttentionPooling, self).__init__()
        self.attention = nn.Linear(hidden_dim, 1)
        
    def forward(self, lstm_out):
        # lstm_out: (batch, seq_len, hidden_dim)
        attention_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attention_weights = F.softmax(attention_weights, dim=1)
        pooled = torch.sum(attention_weights * lstm_out, dim=1)  # (batch, hidden_dim)
        return pooled

class EssayCNNBiLSTM(nn.Module):
    """CNN-LSTM hybrid with attention for essay grading."""
    def __init__(self, vocab_size, embed_dim=128, hidden_dim=128, num_layers=1, dropout=0.3):
        super(EssayCNNBiLSTM, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        
        # CNN layers for local feature extraction (faster than LSTM alone)
        self.conv1 = nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(64, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv1d(64, embed_dim, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(64)
        self.bn2 = nn.BatchNorm1d(64)
        self.bn3 = nn.BatchNorm1d(embed_dim)
        
        # BiLSTM for sequence modeling
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers,
                            bidirectional=True, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        
        # Attention pooling
        self.attention = AttentionPooling(hidden_dim * 2)
        
        # Final layers
        self.fc1 = nn.Linear(hidden_dim * 2, 64)
        self.fc2 = nn.Linear(64, 1)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x):
        # Embedding
        embedded = self.embedding(x)  # (batch, seq_len, embed_dim)
        
        # CNN feature extraction (transpose for conv1d: batch, channels, seq_len)
        x_conv = embedded.transpose(1, 2)
        x_conv = F.relu(self.bn1(self.conv1(x_conv)))
        x_conv = F.relu(self.bn2(self.conv2(x_conv)))
        x_conv = self.bn3(self.conv3(x_conv))
        x_conv = x_conv.transpose(1, 2)  # Back to (batch, seq_len, embed_dim)
        
        # Residual connection
        x_conv = x_conv + embedded
        
        # LSTM
        lstm_out, _ = self.lstm(x_conv)
        
        # Attention pooling
        pooled = self.attention(lstm_out)
        pooled = self.dropout(pooled)
        
        # Final prediction
        out = F.relu(self.fc1(pooled))
        out = self.dropout(out)
        output = self.fc2(out)
        
        return output.squeeze()
