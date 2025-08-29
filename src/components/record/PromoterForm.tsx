import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PromoterFormProps {
  promoterName: string;
  setPromoterName: (name: string) => void;
}

const PromoterForm = ({ promoterName, setPromoterName }: PromoterFormProps) => {
  return (
    <div className="flex flex-col">
      <Card className="p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Анкета</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promoter-name" className="text-sm font-medium text-gray-700">
              Имя промоутера
            </Label>
            <Input
              id="promoter-name"
              type="text"
              placeholder="Введите имя промоутера"
              value={promoterName}
              onChange={(e) => setPromoterName(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-gray-700 font-medium mb-1">Информация:</p>
                <p className="text-gray-600">
                  Данные из анкеты будут отправлены вместе с видео и геолокацией в Telegram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PromoterForm;