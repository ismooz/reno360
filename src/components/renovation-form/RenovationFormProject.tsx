
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Option {
  value: string;
  label: string;
}

interface RenovationFormProjectProps {
  buildingTypes: Option[];
  surfaceTypes: Option[];
  deadlineOptions: Option[];
  budgetRanges: Option[];
  formData: any;
  selectedDate: Date | undefined;
  handleSelectChange: (name: string, value: string) => void;
  handleDateSelect: (date: Date | undefined) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const RenovationFormProject = ({
  buildingTypes,
  surfaceTypes,
  deadlineOptions,
  budgetRanges,
  formData,
  selectedDate,
  handleSelectChange,
  handleDateSelect,
  handleChange,
}: RenovationFormProjectProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-primary">Description de votre projet</h3>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="buildingType">Bâtiment dans lequel se feront les travaux</Label>
        <Select
          value={formData.buildingType}
          onValueChange={(value) => handleSelectChange("buildingType", value)}
          required
        >
          <SelectTrigger id="buildingType">
            <SelectValue placeholder="Sélectionnez un type de bâtiment" />
          </SelectTrigger>
          <SelectContent>
            {buildingTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="surfaceType">Genre de surface</Label>
        <Select
          value={formData.surfaceType}
          onValueChange={(value) => handleSelectChange("surfaceType", value)}
          required
        >
          <SelectTrigger id="surfaceType">
            <SelectValue placeholder="Sélectionnez un type de surface" />
          </SelectTrigger>
          <SelectContent>
            {surfaceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="deadline">Quels sont vos délais ?</Label>
        <Select
          value={formData.deadline}
          onValueChange={(value) => handleSelectChange("deadline", value)}
          required
        >
          <SelectTrigger id="deadline">
            <SelectValue placeholder="Sélectionnez un délai" />
          </SelectTrigger>
          <SelectContent>
            {deadlineOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredDate">Date souhaitée (optionnel)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="preferredDate"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "dd MMMM yyyy", { locale: fr })
              ) : (
                <span>Sélectionner une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="description">Description détaillée des travaux à réaliser</Label>
      <Textarea
        id="description"
        name="description"
        placeholder="Décrivez votre projet en détail : dimensions, finitions, contraintes spécifiques..."
        rows={5}
        value={formData.description}
        onChange={handleChange}
        required
      />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="materialsNeeded">Matériels nécessaires</Label>
        <Select
          value={formData.materialsNeeded}
          onValueChange={(value) => handleSelectChange("materialsNeeded", value)}
          required
        >
          <SelectTrigger id="materialsNeeded">
            <SelectValue placeholder="Sélectionnez une option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fournir">À fournir entièrement</SelectItem>
            <SelectItem value="partiel">Fourniture partielle</SelectItem>
            <SelectItem value="non">Non nécessaire</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Budget indicatif (optionnel)</Label>
        <Select
          value={formData.budget}
          onValueChange={(value) => handleSelectChange("budget", value)}
        >
          <SelectTrigger id="budget">
            <SelectValue placeholder="Sélectionnez un budget" />
          </SelectTrigger>
          <SelectContent>
            {budgetRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

export default RenovationFormProject;
