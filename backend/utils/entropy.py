import math

def calculate_entropy(domain):
    domain = domain.replace('.', '')
    if len(domain) == 0:
        return 0

    probabilities = [
        domain.count(c) / len(domain)
        for c in set(domain)
    ]

    entropy = -sum(p * math.log2(p) for p in probabilities)
    return entropy
