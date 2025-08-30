import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

interface VideoRecorderProps {
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  recordedVideo: Blob | null;
  setRecordedVideo: (video: Blob | null) => void;
  currentStep: 'record' | 'preview' | 'send';
  setCurrentStep: (step: 'record' | 'preview' | 'send') => void;
  quality: string;
  setQuality: (quality: string) => void;
  isUploading: boolean;
  promoterName: string;
  onSendToTelegram: () => void;
  onResetRecording: () => void;
}

const VideoRecorder = ({
  isRecording,
  setIsRecording,
  recordedVideo,
  setRecordedVideo,
  currentStep,
  setCurrentStep,
  quality,
  setQuality,
  isUploading,
  promoterName,
  onSendToTelegram,
  onResetRecording
}: VideoRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getVideoConstraints = useCallback(() => {
    const constraints = {
      video: {
        facingMode: 'environment', // Rear camera
        width: quality === '360p' ? { ideal: 640 } : quality === '720p' ? { ideal: 1280 } : { ideal: 640 },
        height: quality === '360p' ? { ideal: 360 } : quality === '720p' ? { ideal: 720 } : { ideal: 360 },
      },
      audio: true,
    };
    return constraints;
  }, [quality]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getVideoConstraints());
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Configure MediaRecorder with proper codecs for Telegram compatibility
      let options: MediaRecorderOptions = {};
      
      // Try H.264 first for better Telegram compatibility
      const h264Types = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
      ];
      
      const webmTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
      ];

      let selectedMimeType = '';
      
      // First try H.264 formats
      for (const mimeType of h264Types) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      // If H.264 not supported, try WebM
      if (!selectedMimeType) {
        for (const mimeType of webmTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            break;
          }
        }
      }

      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }
      
      // Add video bitrate for better quality
      options.videoBitsPerSecond = quality === '720p' ? 1500000 : 400000;
      options.audioBitsPerSecond = 128000;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || selectedMimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedVideo(blob);
        setCurrentStep('preview');
        
        // Stop video stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100); // Record in smaller chunks for smoother video
      setIsRecording(true);
      toast({ title: "Запись началась", description: "Используется тыловая камера" });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось получить доступ к камере",
        variant: "destructive" 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Запись завершена", description: "Видео готово к отправке" });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-6">
        {['record', 'preview', 'send'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step ? 'bg-blue-500 text-white' :
              ['preview', 'send'].includes(step) && currentStep === 'send' ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`w-8 h-0.5 mx-2 ${
                (currentStep === 'preview' && index === 0) || currentStep === 'send' ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Card className="p-6 mb-6">
        {currentStep === 'record' && (
          <div className="space-y-6">
            {/* Video Preview */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Icon name="Video" size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm opacity-75">Нажмите "Начать запись"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Качество видео
                </label>
                <Select value={quality} onValueChange={setQuality} disabled={isRecording}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360p">360p (экономный)</SelectItem>
                    <SelectItem value="720p">720p (максимальный)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Record Controls */}
            <div className="flex gap-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                size="lg"
              >
                <Icon name={isRecording ? "Square" : "Circle"} size={20} className="mr-2" />
                {isRecording ? "Остановить" : "Начать запись"}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && recordedVideo && (
          <div className="space-y-6">
            {/* Video Preview */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={URL.createObjectURL(recordedVideo)}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Video Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Размер файла:</span>
                <span className="font-medium">{(recordedVideo.size / 1024 / 1024).toFixed(2)} МБ</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Качество:</span>
                <span className="font-medium">{quality}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={onResetRecording} variant="outline" className="flex-1">
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Переснять
              </Button>
              <Button 
                onClick={onSendToTelegram} 
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={16} className="mr-2" />
                    Отправить @maxim_korel
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'send' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Видео отправлено!</h3>
              <p className="text-gray-600">Ваше видео успешно доставлено в Telegram</p>
            </div>
            <Button onClick={onResetRecording} className="w-full bg-blue-500 hover:bg-blue-600">
              <Icon name="Plus" size={16} className="mr-2" />
              Записать новое видео
            </Button>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-900 font-medium mb-1">Советы для лучшей записи:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Держите устройство горизонтально</li>
              <li>• Обеспечьте хорошее освещение</li>
              <li>• Проверьте стабильность интернета</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoRecorder;