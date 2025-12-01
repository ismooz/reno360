import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface RenovationFormAddressProps {
  address: string;
  postalCode: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RenovationFormAddress = ({ address, postalCode, onChange }: RenovationFormAddressProps) => (
  <div className="space-y-4 p-5 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-lg">
        <MapPin className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-primary">Localisation du projet</h3>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-1">
          Adresse complète <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="Rue, numéro, complément"
          value={address}
          onChange={onChange}
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode" className="flex items-center gap-1">
          Code postal <span className="text-destructive">*</span>
        </Label>
        <Input
          id="postalCode"
          name="postalCode"
          placeholder="Ex: 1200"
          value={postalCode}
          onChange={onChange}
          required
          className="bg-background"
        />
      </div>
    </div>
  </div>
);

export default RenovationFormAddress;
