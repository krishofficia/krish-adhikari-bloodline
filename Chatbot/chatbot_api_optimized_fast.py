import numpy as np
import csv
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
import os
from sklearn.metrics.pairwise import cosine_similarity
import time

def read_csv_simple(filename):
    """Read CSV file without pandas"""
    questions = []
    answers = []
    
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            questions.append(row['question'])
            answers.append(row['answer'])
    
    return questions, answers

app = Flask(__name__)

# Load dataset and model
print("Loading chatbot model and data...")

# Load the dataset
questions, answers = read_csv_simple("blood_donation_1000_qa.csv")

# Load the sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load pre-computed embeddings
embeddings = np.load("question_embeddings.npy")

print("Chatbot loaded successfully!")

def chatbot_answer(user_question):
    start_time = time.time()
    q = user_question.lower().strip()

    # Greeting handling
    greetings = ["hello", "hi", "hey", "hii", "hlo"]
    if q in greetings:
        return "Hello! I can help you with blood donation related questions."

    # Quick keyword matching for common questions (faster than embeddings)
    quick_responses = {
        "what is blood donation": "Blood donation is the process of voluntarily giving blood, which is then used for medical treatments and emergencies.",
        "who can donate": "Generally, healthy adults aged 18-65 who weigh at least 50kg can donate blood.",
        "how often": "You can donate whole blood every 56 days (8 weeks).",
        "requirements": "To donate blood, you must be healthy, 18-65 years old, weigh at least 50kg, and pass basic health screening.",
        "side effects": "Common side effects include mild dizziness, bruising, or fatigue. These usually resolve quickly.",
        "benefits": "Blood donation helps save lives, reduces heart disease risk, and provides free health screening.",
    }

    for keyword, response in quick_responses.items():
        if keyword in q:
            return response

    # Use embeddings only for complex questions
    user_emb = model.encode([user_question])
    
    # Use sklearn's optimized cosine similarity (much faster)
    similarities = cosine_similarity(user_emb, embeddings)[0]
    
    # Get top matches
    top_indices = similarities.argsort()[-3:][::-1]  # top 3 matches for speed
    top_scores = similarities[top_indices]

    # Quick intent matching
    for idx in top_indices:
        ans = answers[idx].lower()
        dataset_q = questions[idx].lower()

        # Interval / Gap questions
        if any(word in q for word in ["gap", "days", "months", "interval", "how long", "when"]):
            if any(word in ans for word in ["day", "week", "month", "gap", "interval"]):
                return answers[idx]

        # After donation
        if "after" in q and "donat" in q:
            if "after" in ans:
                return answers[idx]

        # Before donation
        if "before" in q and "donat" in q:
            if "before" in ans:
                return answers[idx]

        # Eligibility
        if any(word in q for word in ["eligible", "can i donate", "requirements", "qualify"]):
            if any(word in ans for word in ["eligible", "requirements", "qualify", "can donate"]):
                return answers[idx]

    # Confidence check
    if top_scores[0] < 0.6:
        return "I can only answer blood donation related questions. Please ask about blood donation, eligibility, or donation process."

    # Return best match
    response_time = time.time() - start_time
    print(f"Response time: {response_time:.2f} seconds")
    
    return answers[top_indices[0]]

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message']
        
        if not user_message.strip():
            return jsonify({'error': 'Empty message'}), 400
        
        # Get chatbot response
        response = chatbot_answer(user_message)
        
        return jsonify({
            'response': response,
            'timestamp': time.time()
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Blood Donation Chatbot API is running',
        'model': 'all-MiniLM-L6-v2',
        'dataset_size': len(questions)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
