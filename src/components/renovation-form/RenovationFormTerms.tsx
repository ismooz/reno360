
interface RenovationFormTermsProps {
  agreedToTerms: boolean;
  setAgreedToTerms: (value: boolean) => void;
}

const RenovationFormTerms = ({ agreedToTerms, setAgreedToTerms }: RenovationFormTermsProps) => (
  <div className="flex items-start space-x-2 pt-2">
    <input
      type="checkbox"
      id="terms"
      className="mt-1"
      checked={agreedToTerms}
      onChange={(e) => setAgreedToTerms(e.target.checked)}
      required
    />
    <label htmlFor="terms" className="text-sm">
      J'accepte que Reno360 traite mes données personnelles conformément à sa{" "}
      <a href="/privacy" className="text-primary underline">
        politique de confidentialité
      </a>
      . Je comprends que mes informations seront utilisées pour traiter ma demande de devis.
    </label>
  </div>
);

export default RenovationFormTerms;
