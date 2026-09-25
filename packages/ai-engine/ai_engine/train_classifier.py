"""
Synthetic data generator and trainer for the Indigenous Behavior Classifier.
Trains a Scikit-learn RandomForestClassifier on student attempt timing and counts.
Exports trained model artifact to classifier.joblib.
"""
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib


def generate_synthetic_data(n_samples: int = 1200, random_seed: int = 42):
    """
    Generates synthetic timing data simulating learner behavior:
    - Fast attempt (< 6,000ms) or rapid guessing -> CARELESS
    - Slow struggle (> 18,000ms) or repeated deliberate attempts -> MISCONCEPTION
    Features: [time_ms, attempts]
    """
    np.random.seed(random_seed)
    half = n_samples // 2

    # CARELESS distribution:
    # Quick impulsive responses: mean 4,000ms, std 1,800ms (min 500ms)
    # Low attempt counts: 1 to 2 attempts typically
    time_careless = np.random.normal(loc=4200, scale=1800, size=half)
    time_careless = np.clip(time_careless, 400, 11000)
    attempts_careless = np.random.choice([1, 2, 3], size=half, p=[0.70, 0.22, 0.08])
    y_careless = np.array(["CARELESS"] * half)

    # MISCONCEPTION distribution:
    # Deliberate struggle: mean 28,000ms, std 9,000ms (min 12,000ms)
    # Higher attempt counts: multiple revisions / attempts
    time_misconception = np.random.normal(loc=29000, scale=9000, size=half)
    time_misconception = np.clip(time_misconception, 12000, 95000)
    attempts_misconception = np.random.choice([2, 3, 4, 5, 6], size=half, p=[0.25, 0.35, 0.22, 0.12, 0.06])
    y_misconception = np.array(["MISCONCEPTION"] * half)

    # Combine
    X_time = np.concatenate([time_careless, time_misconception])
    X_attempts = np.concatenate([attempts_careless, attempts_misconception])
    X = np.column_stack([X_time, X_attempts])
    y = np.concatenate([y_careless, y_misconception])

    # Shuffle
    indices = np.random.permutation(n_samples)
    return X[indices], y[indices]


def train_and_export_model(export_path: Path = None):
    """Trains RandomForestClassifier and exports model artifact."""
    if export_path is None:
        export_path = Path(__file__).resolve().parent / "classifier.joblib"

    print("Generating synthetic student behavior dataset...")
    X, y = generate_synthetic_data(n_samples=1500)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"Training RandomForestClassifier on {len(X_train)} samples...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=4,
        random_state=42
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc * 100:.2f}%")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    # Export model artifact
    joblib.dump(clf, export_path)
    print(f"Trained model exported successfully to: {export_path}")
    return clf, export_path


if __name__ == "__main__":
    train_and_export_model()
