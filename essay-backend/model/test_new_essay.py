"""
Test script to grade a new essay using the trained model.
"""
import torch
from src.deep_model import EssayCNNBiLSTM
from src.dataset import Vocab
from src.data_loader import clean_essay

def load_model_and_vocab():
    """Load the trained model and vocabulary."""
    model_path = "models/deep_essay_grader.pt"
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load checkpoint
    checkpoint = torch.load(model_path, map_location=device)
    vocab_dict = checkpoint["vocab"]
    
    # Rebuild vocab
    vocab = Vocab()
    vocab.word2idx = vocab_dict
    vocab.idx2word = {idx: word for word, idx in vocab_dict.items()}
    
    # Rebuild model
    model = EssayCNNBiLSTM(vocab_size=len(vocab), embed_dim=128, hidden_dim=128, num_layers=1)
    model.load_state_dict(checkpoint["model_state"])
    model.to(device)
    model.eval()
    
    return model, vocab, device

def grade_essay(text, model, vocab, device, max_len=300):
    """Grade a new essay."""
    # Clean the essay
    cleaned = clean_essay(text)
    
    # Encode the essay
    encoded = vocab.encode(cleaned)
    
    # Pad or truncate to max_len
    if len(encoded) < max_len:
        encoded += [0] * (max_len - len(encoded))
    else:
        encoded = encoded[:max_len]
    
    # Convert to tensor and predict
    tensor = torch.tensor([encoded], dtype=torch.long, device=device)
    with torch.no_grad():
        pred = model(tensor).item()
    
    # Model outputs scores on 0-60 scale (based on training data)
    score = max(0.0, min(60.0, float(pred)))
    
    return score, cleaned

if __name__ == "__main__":
    print("Loading model...")
    model, vocab, device = load_model_and_vocab()
    print(f"Model loaded successfully! (Device: {device})\n")
    
    # Sample essays to test
    sample_essays = [
        {
            "title": "Sample Essay 1 - Basic",
            "text": "The importance of education cannot be overstated. Education provides individuals with knowledge and skills necessary for success. It opens doors to opportunities and helps people make informed decisions. Without education, society would struggle to progress and innovate."
        },
        {
            "title": "Sample Essay 2 - More Detailed",
            "text": "Climate change represents one of the most pressing challenges of our time. The scientific evidence is overwhelming: global temperatures are rising, ice caps are melting, and extreme weather events are becoming more frequent. Human activities, particularly the burning of fossil fuels, have significantly contributed to this phenomenon. To address climate change, we must transition to renewable energy sources, reduce carbon emissions, and implement sustainable practices. Governments, businesses, and individuals all have a role to play in creating a more sustainable future. The consequences of inaction are severe, affecting not only our generation but also future generations. Therefore, immediate and decisive action is required to mitigate the impacts of climate change and preserve our planet for posterity."
        },
        {
            "title": "Sample Essay 3 - Short and Simple",
            "text": "I think technology is good. It helps us do things faster. We use phones and computers every day. Technology makes life easier."
        }
    ]
    
    print("="*70)
    print("GRADING NEW ESSAYS")
    print("="*70)
    
    for i, essay in enumerate(sample_essays, 1):
        print(f"\n{essay['title']}")
        print("-" * 70)
        print(f"Essay Text: {essay['text'][:100]}..." if len(essay['text']) > 100 else f"Essay Text: {essay['text']}")
        
        score, cleaned = grade_essay(essay['text'], model, vocab, device)
        
        print(f"\nPredicted Score: {score:.2f} / 60")
        print(f"Word Count: {len(cleaned.split())}")
        print(f"Character Count: {len(cleaned)}")
        
        # Provide interpretation (based on 0-60 scale)
        if score >= 50:
            grade_level = "Excellent"
        elif score >= 40:
            grade_level = "Good"
        elif score >= 30:
            grade_level = "Average"
        elif score >= 20:
            grade_level = "Below Average"
        else:
            grade_level = "Needs Improvement"
        
        print(f"Grade Level: {grade_level}")
    
    print("\n" + "="*70)
    print("You can now enter any new essay and get a grade!")
    print("The model will:")
    print("  1. Clean and preprocess the text")
    print("  2. Convert words to numbers using the vocabulary")
    print("  3. Run it through the CNN-LSTM model")
    print("  4. Return a score between 0-60 (based on training data scale)")
    print("\nNote: The model was trained on scores from 0-60, so predictions")
    print("      will be in that range. Higher scores indicate better essays.")
    print("="*70)

