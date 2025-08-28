import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [currentStep, setCurrentStep] = useState<'record' | 'preview' | 'send'>('record');
  const [quality, setQuality] = useState('720p');
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Telegram Bot configuration
  const TELEGRAM_BOT_TOKEN = '7248503815:AAHq9hOmuE0H8GEqSVc0FjnH9qRYmpUoJOo';
  const TELEGRAM_USERNAME = '@maxim_korel';

  const getVideoConstraints = useCallback(() => {
    const constraints = {
      video: {
        facingMode: 'environment', // Rear camera
        width: quality === '1080p' ? { ideal: 1920 } : quality === '720p' ? { ideal: 1280 } : { ideal: 640 },
        height: quality === '1080p' ? { ideal: 1080 } : quality === '720p' ? { ideal: 720 } : { ideal: 480 },
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

      // Configure MediaRecorder with proper codecs
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
      };

      // Fallback for different browsers/devices
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/mp4';
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedVideo(blob);
        setCurrentStep('preview');
        
        // Stop video stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
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

  const sendToTelegram = async () => {
    if (!recordedVideo) return;

    setIsUploading(true);
    
    try {
      // Сначала получаем chat_id пользователя @maxim_korel
      let chatId: string;
      
      try {
        const updatesResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        const updatesData = await updatesResponse.json();
        
        // Ищем чат с пользователем @maxim_korel
        const targetChat = updatesData.result?.find((update: any) => 
          update.message?.from?.username === 'maxim_korel' ||
          update.message?.chat?.username === 'maxim_korel'
        );
        
        if (targetChat) {
          chatId = targetChat.message.chat.id.toString();
        } else {
          // Если не найден в обновлениях, используем username напрямую
          chatId = TELEGRAM_USERNAME;
        }
      } catch {
        // Fallback - используем username напрямую
        chatId = TELEGRAM_USERNAME;
      }

      // Конвертируем в MP4 для лучшей совместимости
      const videoFile = new File([recordedVideo], 'video.mp4', { 
        type: 'video/mp4',
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('video', videoFile);
      formData.append('caption', '📹 Новое видео с камеры');
      formData.append('supports_streaming', 'true');

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
      
      const response = await fetch(telegramUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast({ 
          title: "✅ Отправлено Максиму!", 
          description: `Видео доставлено пользователю ${TELEGRAM_USERNAME}` 
        });
        setCurrentStep('send');
      } else {
        console.error('Telegram API error:', result);
        throw new Error(result.description || 'Ошибка Telegram API');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      
      // Показываем более детальную информацию об ошибке
      let errorMessage = "Проверьте интернет-соединение";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = "CORS ошибка - попробуйте позже";
      } else if (error.message && error.message.includes('chat not found')) {
        errorMessage = "Пользователь @maxim_korel не найден или не писал боту";
      } else if (error.message && error.message.includes('bot token')) {
        errorMessage = "Неверный токен бота";
      } else if (error.message && error.message.includes('Forbidden')) {
        errorMessage = "Пользователь @maxim_korel заблокировал бота или не начал диалог";
      }
      
      toast({ 
        title: "❌ Ошибка отправки", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setRecordedVideo(null);
    setCurrentStep('record');
    chunksRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Видео Рекордер</h1>
            <Badge variant={isRecording ? "destructive" : "secondary"}>
              {isRecording ? "Запись..." : "Готов"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
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
                      <SelectItem value="480p">480p (экономный)</SelectItem>
                      <SelectItem value="720p">720p (стандартный)</SelectItem>
                      <SelectItem value="1080p">1080p (высокий)</SelectItem>
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
                <Button onClick={resetRecording} variant="outline" className="flex-1">
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Переснять
                </Button>
                <Button 
                  onClick={sendToTelegram} 
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
              <Button onClick={resetRecording} className="w-full bg-blue-500 hover:bg-blue-600">
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
    </div>
  );
};

export default Index;