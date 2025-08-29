import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const QRCodeSection = () => {
  return (
    <div className="flex flex-col">
      <Card className="p-6 h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">QR Код для сканирования</h3>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer transition-transform hover:scale-105 active:scale-95 glowing-border">
              <img 
                src="/img/328b78de-5328-4a32-b18b-f7e5978fb5aa.jpg"
                alt="QR Code"
                className="w-80 h-80 object-contain rounded-lg shadow-lg relative z-10"
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full">
            <div className="flex items-center justify-center p-4">
              <img 
                src="/img/328b78de-5328-4a32-b18b-f7e5978fb5aa.jpg"
                alt="QR Code - Увеличенный"
                className="w-full max-w-lg h-auto object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
        
        <p className="text-sm text-gray-600 text-center mt-4 max-w-sm">
          Нажмите на QR код для увеличения. Отсканируйте его для получения дополнительной информации.
        </p>
      </Card>
    </div>
  );
};

export default QRCodeSection;