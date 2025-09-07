import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface VideoPlaybackProps {
  recordedVideo: Blob;
  quality: string;
  parentName: string;
  childName: string;
  childAge: string;
  phone: string;
  location: { lat: number; lon: number } | null;
  isUploading: boolean;
  resetRecording: () => void;
  uploadToTelegram: () => void;
}

const VideoPlayback = ({
  recordedVideo,
  quality,
  parentName,
  childName,
  childAge,
  phone,
  location,
  isUploading,
  resetRecording,
  uploadToTelegram,
}: VideoPlaybackProps) => {
  return (
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
          <span className="font-medium">{Math.round(recordedVideo.size / 1024)} KB</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Формат:</span>
          <span className="font-medium">{recordedVideo.type || 'video/mp4'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Качество:</span>
          <span className="font-medium">{quality}</span>
        </div>
      </div>

      {/* Form Data Preview */}
      {(parentName || childName || childAge || phone || location) && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Данные анкеты:</h4>
          {parentName && <p className="text-sm text-blue-800">👤 Родитель: {parentName}</p>}
          {childName && <p className="text-sm text-blue-800">👶 Ребенок: {childName}</p>}
          {childAge && <p className="text-sm text-blue-800">🎂 Возраст: {childAge} лет</p>}
          {phone && <p className="text-sm text-blue-800">📞 Телефон: {phone}</p>}
          {location && (
            <p className="text-sm text-blue-800">
              📍 Координаты: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={resetRecording}
          variant="outline"
          className="flex-1"
        >
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Перезаписать
        </Button>
        <Button
          onClick={uploadToTelegram}
          className="flex-1 bg-green-500 hover:bg-green-600"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" size={16} className="mr-2" />
              Отправить
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayback;