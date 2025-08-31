import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SetupAdmin = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setStatus("");
    const email = "admin@reno360.ch";
    const password = "admin123";

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { role: "admin", name: "Administrateur" },
        },
      });

      if (error) {
        // If user exists already, try to sign in and enforce role metadata
        if (
          error.message?.toLowerCase().includes("already") ||
          error.message?.toLowerCase().includes("registered")
        ) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInError) {
            await supabase.auth.updateUser({ data: { role: "admin" } });
            setStatus(
              "L'utilisateur admin existe déjà. Connexion effectuée et rôle confirmé."
            );
          } else {
            setStatus(
              "L'utilisateur admin existe déjà. Impossible de se connecter automatiquement."
            );
          }
        } else {
          setStatus(`Erreur lors de la création: ${error.message}`);
        }
      } else {
        setStatus(
          "Compte admin créé. Si la confirmation email est activée, veuillez confirmer l'email puis vous connecter."
        );
      }
    } catch (e: any) {
      setStatus(`Erreur inattendue: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold">Configuration administrateur</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ce module temporaire crée un compte administrateur avec l'email
              <strong> admin@reno360.ch</strong>.
            </p>
            <Button onClick={handleCreateAdmin} disabled={loading}>
              {loading ? "Création en cours..." : "Créer l'admin maintenant"}
            </Button>
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Astuce: pour accélérer les tests, vous pouvez désactiver la
              confirmation d'email dans Supabase (Authentication → Settings) puis
              la réactiver ensuite.
            </p>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default SetupAdmin;
