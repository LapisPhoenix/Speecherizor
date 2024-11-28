from socket import gethostname
from flask import Flask, render_template, request, jsonify
from speech_recognition import Recognizer, AudioFile

app = Flask(__name__)
recognizer = Recognizer()


@app.route('/')
def page():
    return render_template('index.html')

@app.route('/process_audio', methods=['POST'])
def process_audio():
    file = request.files['audio']
    file.stream.seek(0)

    with AudioFile(file.stream) as source:
        if source is None:
            return jsonify({'error': 'File is not a valid audio file!'}), 400
        elif not 10 <= source.DURATION <= 30.999:
            return jsonify({'error': 'File is too long/short! File should be between 10 to 30 seconds.'}), 400

        audio_data = recognizer.record(source, 30)

        text = recognizer.recognize_google(audio_data)
        if not text:
            return jsonify({'error': 'Cannot detect any voices!'}), 400

        words = len(text.split())
        words_per_minute = (words / source.DURATION) * 60

        return jsonify({"wpm": words_per_minute, "duration": source.DURATION, "text": text})

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        wmp = float(request.form['wpm'])  # Ensure it's a number
        hours = int(request.form['hours'])
        minutes = int(request.form['minutes'])
        seconds = int(request.form['seconds'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Please enter valid inputs!'}), 400

    print(wmp, hours, minutes, seconds)

    total_time = (hours * 60) + minutes + (seconds / 60)

    words = int(wmp * total_time)
    print(f"Results of /calculate:  {words}")

    return jsonify({"word_count": words, "wpm": wmp})



if __name__ == '__main__':
    if 'liveconsole' not in gethostname():
        app.run()
