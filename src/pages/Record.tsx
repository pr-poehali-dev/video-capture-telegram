import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import QRCodeSection from '@/components/record/QRCodeSection';
import PromoterForm from '@/components/record/PromoterForm';
import VideoRecorder from '@/components/record/VideoRecorder';

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [currentStep, setCurrentStep] = useState<'record' | 'preview' | 'send'>('record');
  const [quality, setQuality] = useState('720p');
  const [isUploading, setIsUploading] = useState(false);
  const [promoterName, setPromoterName] = useState('');

  // Telegram Bot configuration
  const TELEGRAM_BOT_TOKEN = '8286818285:AAGqkSsTlsbKCT1guKYoDpkL_OcldAVyuSE';
  const TELEGRAM_CHAT_ID = '5215501225'; // @maxim_korel

  const sendToTelegram = async () => {
    if (!recordedVideo) return;

    setIsUploading(true);
    
    try {
      // Определяем правильное расширение и MIME type
      const mimeType = recordedVideo.type || 'video/webm';
      const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';
      const fileName = `video_${Date.now()}${extension}`;
      
      // Создаем файл с правильным MIME type
      const videoFile = new File([recordedVideo], fileName, { 
        type: mimeType,
        lastModified: Date.now()
      });

      // Получаем сохраненную геолокацию
      const locationData = localStorage.getItem('userLocation');
      let locationText = '';
      
      if (locationData) {
        try {
          const location = JSON.parse(locationData);
          const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
          locationText = `\n📍 Местоположение: ${googleMapsUrl}`;
          if (location.accuracy) {
            locationText += `\n🎯 Точность: ${Math.round(location.accuracy)}м`;
          }
        } catch (e) {
          console.error('Ошибка парсинга геолокации:', e);
        }
      }

      // Добавляем данные промоутера
      let promoterText = '';
      if (promoterName.trim()) {
        promoterText = `👤 Промоутер: ${promoterName.trim()}`;
      }

      // Создаем caption без лишнего текста "Видео"
      const captionParts = [promoterText, locationText].filter(part => part.trim());
      const caption = captionParts.join('\n');

      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('video', videoFile);
      if (caption) {
        formData.append('caption', caption);
      }
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
          description: "Видео, анкета и геолокация доставлены в Telegram" 
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
    setPromoterName(''); // Очищаем форму при сбросе
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">IMPERIA PROMO</h1>
            {isRecording && (
              <Badge variant="destructive">
                Запись...
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Left Column - QR Code */}
          <QRCodeSection />

          {/* Middle Column - Promoter Form */}
          <PromoterForm 
            promoterName={promoterName}
            setPromoterName={setPromoterName}
          />

          {/* Right Column - Video Recording */}
          <VideoRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            recordedVideo={recordedVideo}
            setRecordedVideo={setRecordedVideo}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            quality={quality}
            setQuality={setQuality}
            isUploading={isUploading}
            promoterName={promoterName}
            onSendToTelegram={sendToTelegram}
            onResetRecording={resetRecording}
          />

        </div>
      </div>
    </div>
  );
};

export default Record;