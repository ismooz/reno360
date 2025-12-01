import { Checkbox } from '@/components/ui/checkbox';

interface RenovationFormTermsProps {
  agreedToTerms: boolean;
  setAgreedToTerms: (value: boolean) => void;
}

const RenovationFormTerms = ({ agreedToTerms, setAgreedToTerms }: RenovationFormTermsProps) => (
  <div className="flex items-start space-x-3 p-4 bg-muted/20 rounded-lg border border-border/30">
    <Checkbox
      id="terms"
      checked={agreedToTerms}
      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
      className="mt-0.5"
    />
    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
      J'accepte que Reno360 traite mes données personnelles conformément à sa{" "}
      <a href="/privacy" className="text-primary underline hover:text-primary/80">
        politique de confidentialité
      </a>
      . Je comprends que mes informations seront utilisées pour traiter ma demande de devis.
    </label>
  </div>
);

export default RenovationFormTerms;
