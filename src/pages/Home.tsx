import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Home = () => {
  const navigate = useNavigate();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleNewLead = async () => {
    setIsGettingLocation(true);
    
    try {
      // Проверяем поддержку геолокации
      if (!navigator.geolocation) {
        toast({
          title: "Геолокация недоступна",
          description: "Ваш браузер не поддерживает геолокацию",
          variant: "destructive"
        });
        // Переходим без геолокации
        setTimeout(() => navigate('/record'), 2000);
        return;
      }

      // Сначала проверяем разрешения на современных браузерах
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('Статус разрешения геолокации:', permission.state);
          
          if (permission.state === 'denied') {
            toast({
              title: "Геолокация заблокирована",
              description: "Разрешите доступ к местоположению в настройках браузера и перезагрузите страницу",
              variant: "destructive"
            });
            // Переходим без геолокации через 3 секунды
            setTimeout(() => navigate('/record'), 3000);
            return;
          }
        } catch (permError) {
          console.log('Permissions API недоступен:', permError);
        }
      }

      // Специальная обработка для мобильных устройств (особенно Android)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Показываем инструкции для мобильных пользователей
        toast({
          title: "📱 Требуется разрешение",
          description: isAndroid 
            ? "На Android: нажмите 'Разрешить' когда браузер спросит о доступе к местоположению"
            : "Нажмите 'Разрешить' для доступа к местоположению",
        });
      }

      // Получаем геолокацию с улучшенными параметрами
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: !isAndroid, // На Android высокая точность может вызывать проблемы
          timeout: isAndroid ? 15000 : 10000, // Больше времени для Android
          maximumAge: isMobile ? 300000 : 60000 // На мобильных кешируем дольше
        };

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          options
        );
      });

      // Сохраняем координаты
      localStorage.setItem('userLocation', JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      }));

      toast({
        title: "✅ Местоположение получено",
        description: `Точность: ${Math.round(position.coords.accuracy)}м. Переходим к записи видео`,
      });

      // Небольшая задержка для показа сообщения
      setTimeout(() => navigate('/record'), 1000);
      
    } catch (error: any) {
      console.error('Ошибка получения геолокации:', error);
      
      let errorMessage = "Не удалось получить местоположение";
      let shouldContinue = true;
      
      // Обрабатываем разные типы ошибок
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = "❌ Доступ к геолокации запрещен. Разрешите в настройках браузера";
          shouldContinue = true;
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = "📍 Местоположение недоступно. Проверьте GPS/интернет";
          shouldContinue = true;
          break;
        case 3: // TIMEOUT
          errorMessage = "⏱️ Превышено время ожидания. Попробуйте еще раз";
          shouldContinue = true;
          break;
        default:
          errorMessage = "Ошибка геолокации. Продолжаем без координат";
          shouldContinue = true;
      }

      toast({
        title: "Проблема с геолокацией",
        description: errorMessage + (shouldContinue ? ". Переходим к записи видео" : ""),
        variant: "destructive"
      });

      // Переходим к записи даже без геолокации
      if (shouldContinue) {
        setTimeout(() => navigate('/record'), 2500);
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden flex flex-col p-4">
      {/* Enhanced space background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stellar background removed for cleaner look */}
      </div>

      {/* Main content - centered vertically and horizontally */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="text-center ml-1.5">
          <h1 className="text-5xl md:text-7xl font-black tracking-wider mb-2 animate-pulse-soft text-gray-300 drop-shadow-[0_0_8px_rgba(156,163,175,0.3)]">
            IMPERIA
          </h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent opacity-60"></div>
            <h2 className="text-2xl md:text-4xl font-normal tracking-[0.3em] animate-pulse-soft-delay text-gray-400 drop-shadow-[0_0_6px_rgba(156,163,175,0.2)]">
              PROMO
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Button - positioned at bottom center */}
      <div className="relative z-10 flex justify-center mb-32 -ml-1.5">
        <Button
          onClick={handleNewLead}
          disabled={isGettingLocation}
          size="default"
          className="bg-gradient-to-r from-gray-800/60 via-gray-900/60 to-gray-800/60 backdrop-blur-sm text-gray-300 text-lg px-8 py-4 rounded-2xl shadow-[0_0_12px_rgba(156,163,175,0.2)] transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_18px_rgba(156,163,175,0.3)] hover:from-gray-700/70 hover:via-gray-800/70 hover:to-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-500/20 font-bold tracking-wide uppercase relative overflow-hidden group"
        >
          {isGettingLocation ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Получение местоположения...
            </div>
          ) : (
            <>
              <span className="relative z-10 drop-shadow-[0_0_4px_rgba(156,163,175,0.2)]">Новый лид</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </>
          )}
        </Button>
      </div>

      {/* Cosmic fog overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-gray-900/40 to-black/30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
};

export default Home;