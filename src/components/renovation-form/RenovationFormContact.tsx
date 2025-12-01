import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface RenovationFormContactProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RenovationFormContact = ({ formData, handleChange }: RenovationFormContactProps) => (
  <div className="space-y-4 p-5 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-lg">
        <User className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-primary">Vos coordonnées</h3>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Nom complet <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Jean Dupont"
          value={formData.name}
          onChange={handleChange}
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-1">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jean.dupont@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2 md:col-span-2 md:w-1/2">
        <Label htmlFor="phone" className="flex items-center gap-1">
          Téléphone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          placeholder="+41 XX XXX XX XX"
          value={formData.phone}
          onChange={handleChange}
          required
          className="bg-background"
        />
      </div>
    </div>
  </div>
);

export default RenovationFormContact;
