import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// Import decomposed components
import VideoPreview from '@/components/record/VideoPreview';
import RecordForm from '@/components/record/RecordForm';
import VideoPlayback from '@/components/record/VideoPlayback';
import QRCodeSection from '@/components/record/QRCodeSection';

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [currentStep, setCurrentStep] = useState<'record' | 'preview' | 'send'>('record');
  const [quality, setQuality] = useState('360p');
  const [isUploading, setIsUploading] = useState(false);

  // Form data
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const TELEGRAM_BOT_TOKEN = '8286818285:AAGqkSsTlsbKCT1guKYoDpkL_OcldAVyuSE';
  const TELEGRAM_CHAT_ID = '5215501225'; // @maxim_korel

  const getVideoConstraints = useCallback(() => {
    const constraints = {
      video: {
        facingMode: 'environment', // Rear camera
        width: quality === '360p' ? { ideal: 640 } : quality === '480p' ? { ideal: 854 } : { ideal: 640 },
        height: quality === '360p' ? { ideal: 360 } : quality === '480p' ? { ideal: 480 } : { ideal: 360 },
      },
      audio: true,
    };
    return constraints;
  }, [quality]);

  // Get user location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        setLocationError('Не удалось получить геолокацию');
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getVideoConstraints());
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Configure MediaRecorder with proper codecs for Telegram compatibility
      let options: MediaRecorderOptions = {};
      
      // Check for supported MIME types in order of preference
      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }
      
      // Add video bitrate for better quality
      options.videoBitsPerSecond = quality === '480p' ? 800000 : 400000;
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
        const blob = new Blob(chunksRef.current, { 
          type: selectedMimeType || 'video/mp4' 
        });
        setRecordedVideo(blob);
        setCurrentStep('preview');
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "❌ Ошибка",
        description: "Не удалось начать запись. Проверьте доступ к камере.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadToTelegram = async () => {
    if (!recordedVideo) {
      toast({ title: "❌ Ошибка", description: "Нет видео для отправки", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create proper file name based on MIME type
      let fileName = 'video.mp4';
      let mimeType = 'video/mp4';
      
      if (recordedVideo.type) {
        mimeType = recordedVideo.type;
        if (recordedVideo.type.includes('webm')) {
          fileName = 'video.webm';
        } else if (recordedVideo.type.includes('mp4')) {
          fileName = 'video.mp4';
        }
      }
      
      console.log('Отправка видео:', {
        size: Math.round(recordedVideo.size / 1024) + 'KB',
        type: mimeType,
        fileName
      });

      // Создаем файл с правильным MIME type
      const videoFile = new File([recordedVideo], fileName, { 
        type: mimeType,
        lastModified: Date.now()
      });

      // Формируем данные анкеты
      let formInfo = '';
      if (parentName) formInfo += `👤 Родитель: ${parentName}\n`;
      if (childName) formInfo += `👶 Ребенок: ${childName}\n`;
      if (childAge) formInfo += `🎂 Возраст: ${childAge} лет\n`;
      if (phone) formInfo += `📞 Телефон: ${phone}\n`;
      
      // Добавляем геолокацию
      let locationText = '';
      if (location) {
        locationText = `📍 Координаты: ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}\n`;
      }

      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('video', videoFile);
      const caption = `📹 Новое видео с камеры\n\n${formInfo}${locationText}`.trim();
      formData.append('caption', caption);
      formData.append('supports_streaming', 'true');

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
      
      const response = await fetch(telegramUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Telegram response:', data);

      if (data.ok) {
        toast({ 
          title: "✅ Успешно!", 
          description: "Видео отправлено в Telegram",
          variant: "default" 
        });
        
        // Reset form and go back to record step
        setParentName('');
        setChildName('');
        setChildAge('');
        setPhone('');
        setLocation(null);
        resetRecording();
      } else {
        throw new Error(data.description || 'Ошибка API Telegram');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Показываем более детальную информацию об ошибке
      let errorMessage = "Проверьте интернет-соединение";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = "CORS ошибка - попробуйте позже";
      } else if (error.message && error.message.includes('chat not found')) {
        errorMessage = "Пользователь не найден";
      } else if (error.message && error.message.includes('bot token')) {
        errorMessage = "Неверный токен бота";
      } else if (error.message && error.message.includes('Forbidden')) {
        errorMessage = "Пользователь заблокировал бота или не начал диалог";
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Видео Рекордер</h1>
            <Badge variant={isRecording ? "destructive" : "secondary"}>
              {isRecording ? "Запись..." : "Готов"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column - QR Code */}
          <div className="flex flex-col">
            <QRCodeSection />
          </div>

          {/* Right Column - Video Recording Interface */}
          <div className="flex flex-col">
            <Card className="p-6 flex-1 flex flex-col">
              {currentStep === 'record' && (
                <div className="flex flex-col h-full space-y-6">
                  <VideoPreview 
                    ref={videoRef}
                    isRecording={isRecording}
                  />
                  
                  <RecordForm
                    quality={quality}
                    setQuality={setQuality}
                    parentName={parentName}
                    setParentName={setParentName}
                    childName={childName}
                    setChildName={setChildName}
                    childAge={childAge}
                    setChildAge={setChildAge}
                    phone={phone}
                    setPhone={setPhone}
                    location={location}
                    locationError={locationError}
                    getCurrentLocation={getCurrentLocation}
                    isRecording={isRecording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                  />
                </div>
              )}

              {currentStep === 'preview' && recordedVideo && (
                <VideoPlayback
                  recordedVideo={recordedVideo}
                  quality={quality}
                  parentName={parentName}
                  childName={childName}
                  childAge={childAge}
                  phone={phone}
                  location={location}
                  isUploading={isUploading}
                  resetRecording={resetRecording}
                  uploadToTelegram={uploadToTelegram}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;