
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenovationFormAddressProps {
  address: string;
  postalCode: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RenovationFormAddress = ({ address, postalCode, onChange }: RenovationFormAddressProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-primary">Dans quelle région souhaitez-vous faire vos travaux?</h3>
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="address">Adresse complète</Label>
        <Input
          id="address"
          name="address"
          placeholder="Rue, numéro, complément"
          value={address}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">Code postal</Label>
        <Input
          id="postalCode"
          name="postalCode"
          placeholder="Ex: 1200"
          value={postalCode}
          onChange={onChange}
          required
        />
      </div>
    </div>
  </div>
);

export default RenovationFormAddress;
