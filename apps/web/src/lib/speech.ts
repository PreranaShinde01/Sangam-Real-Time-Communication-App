import { LiveCaption } from '@sangam/shared';

export class SpeechManager {
  private recognition: any = null;
  private isListening = false;
  private onCaptionCallback: (caption: string, isFinal: boolean) => void;

  constructor(onCaption: (caption: string, isFinal: boolean) => void) {
    this.onCaptionCallback = onCaption;
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.onCaptionCallback(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        this.onCaptionCallback(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {}
      }
    };
  }

  public start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('Error starting speech recognition:', e);
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public static exportTranscript(captions: LiveCaption[]): string {
    return captions
      .map((c) => {
        const time = new Date(c.timestamp).toLocaleTimeString();
        return `[${time}] ${c.speakerName}: ${c.text}`;
      })
      .join('\n');
  }
}
