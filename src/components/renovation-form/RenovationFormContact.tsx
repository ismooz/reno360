
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenovationFormContactProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RenovationFormContact = ({ formData, handleChange }: RenovationFormContactProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Vos coordonnées</h3>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input
          id="name"
          name="name"
          placeholder="Jean Dupont"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jean.dupont@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="+41 XX XXX XX XX"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  </div>
);

export default RenovationFormContact;
