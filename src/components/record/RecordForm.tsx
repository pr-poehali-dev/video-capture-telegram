import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface RecordFormProps {
  quality: string;
  setQuality: (quality: string) => void;
  parentName: string;
  setParentName: (name: string) => void;
  childName: string;
  setChildName: (name: string) => void;
  childAge: string;
  setChildAge: (age: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  location: { lat: number; lon: number } | null;
  locationError: string;
  getCurrentLocation: () => void;
  isRecording: boolean;
  isRecording2: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

const RecordForm = ({
  quality,
  setQuality,
  parentName,
  setParentName,
  childName,
  setChildName,
  childAge,
  setChildAge,
  phone,
  setPhone,
  location,
  locationError,
  getCurrentLocation,
  isRecording,
  startRecording,
  stopRecording,
}: RecordFormProps) => {
  return (
    <div className="space-y-6">
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
              <SelectItem value="480p">480p (максимальный)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Form Fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Анкета</h3>
          
          <div>
            <Input 
              placeholder="Имя родителя"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              disabled={isRecording}
            />
          </div>
          
          <div>
            <Input 
              placeholder="Имя ребенка"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              disabled={isRecording}
            />
          </div>
          
          <div>
            <Input 
              placeholder="Возраст ребенка"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              type="number"
              disabled={isRecording}
            />
          </div>
          
          <div>
            <Input 
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              disabled={isRecording}
            />
          </div>
          
          <div>
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isRecording}
            >
              <Icon name="MapPin" size={16} className="mr-2" />
              {location ? 'Геолокация получена' : 'Получить геолокацию'}
            </Button>
            {locationError && (
              <p className="text-xs text-red-500 mt-1">{locationError}</p>
            )}
            {location && (
              <p className="text-xs text-green-600 mt-1">
                📍 {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </p>
            )}
          </div>
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
  );
};

export default RecordForm;