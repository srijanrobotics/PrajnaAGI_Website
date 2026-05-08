import sys

def fix_encoding(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to encode as latin-1 to get back the original bytes
    # Then decode as utf-8
    try:
        fixed = content.encode('latin-1').decode('utf-8')
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Successfully fixed {filename}")
    except Exception as e:
        print(f"Failed to fix {filename}: {e}")

if __name__ == "__main__":
    fix_encoding(sys.argv[1])
