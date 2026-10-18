// Connexion de l'admin au serveur Supabase de la boutique, partagée par les onglets
// Commandes, Clients, Demandes, Ventes et Installation.
//   AdminServeur.client(D)        → client Supabase (ou null si pas encore configuré)
//   AdminServeur.connecte(D)      → true si un administrateur est connecté
//   AdminServeur.appel(D, action, corps) → appelle la fonction serveur « admin »
//   AdminServeur.ecranConnexion(zone, ctx, apres) → formulaire de connexion
//   AdminServeur.deconnecter(D)
(function () {
  let client = null;
  const config = (D) => D?.site?.commandes || {};

  function obtenir(D) {
    const c = config(D);
    if (!c.supabaseUrl || !c.supabaseCle || !window.supabase) return null;
    if (!client || client.__url !== c.supabaseUrl || client.__cle !== c.supabaseCle) {
      client = window.supabase.createClient(c.supabaseUrl, c.supabaseCle, { auth: { persistSession: true, storageKey: "mtb-admin-supabase", detectSessionInUrl: true } });
      client.__url = c.supabaseUrl;
      client.__cle = c.supabaseCle;
    }
    return client;
  }

  async function session(D) {
    const c = obtenir(D);
    if (!c) return null;
    return (await c.auth.getSession()).data.session; // rafraîchie automatiquement si elle expire
  }

  async function appel(D, action, corps = {}) {
    const s = await session(D);
    if (!s) throw new Error("Connectez-vous d'abord au compte administrateur.");
    const r = await fetch(`${config(D).supabaseUrl.replace(/\/$/, "")}/functions/v1/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config(D).supabaseCle, Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ action, ...corps }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.erreur || `Erreur ${r.status}`), { status: r.status });
    return d;
  }

  function ecranConnexion(zone, ctx, apres, erreur = "") {
    const c = obtenir(ctx.D);
    if (!c) {
      zone.innerHTML = `
        <section class="bloc">
          <div class="bloc-tete"><h2>Serveur de la boutique : à installer</h2></div>
          <p>Les commandes en ligne, le fichier clients, les demandes de devis, les ventes en boutique et les codes promo ont besoin du serveur gratuit <strong>Supabase</strong>. L'assistant d'installation vous guide pas à pas (une vingtaine de minutes, une seule fois).</p>
          <div><button class="btn" data-aller="installation">Ouvrir l'assistant d'installation</button></div>
        </section>`;
      return;
    }
    const e = ctx.echapper;
    zone.innerHTML = `
      <section class="bloc" style="max-width:520px">
        <div class="bloc-tete"><h2>Connexion au compte administrateur</h2></div>
        <p class="aide">L'email et le mot de passe choisis dans l'assistant d'installation. La connexion est mémorisée sur cet appareil.</p>
        <form class="pile" data-srv="connexion">
          <div class="champ"><label for="srv-email">Email</label><input type="email" id="srv-email" required autocomplete="username"></div>
          <div class="champ"><label for="srv-mdp">Mot de passe</label><input type="password" id="srv-mdp" required autocomplete="current-password"></div>
          <button class="btn" type="submit">Se connecter</button>
          <button class="mini" type="button" data-srv="oubli" style="justify-self:start">Mot de passe oublié ?</button>
          ${erreur ? `<p class="message message-alerte">${e(erreur)}</p>` : ""}
        </form>
      </section>`;
    zone.querySelector('[data-srv="connexion"]').onsubmit = async (ev) => {
      ev.preventDefault();
      const { error } = await c.auth.signInWithPassword({ email: zone.querySelector("#srv-email").value.trim(), password: zone.querySelector("#srv-mdp").value });
      if (error) return ecranConnexion(zone, ctx, apres, /fetch|network/i.test(error.message) ? "Serveur injoignable : vérifiez l'installation." : "Email ou mot de passe incorrect.");
      apres();
    };
    zone.querySelector('[data-srv="oubli"]').onclick = async () => {
      const email = zone.querySelector("#srv-email").value.trim();
      if (!email) return ctx.toast("Indiquez d'abord votre email.", true);
      const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
      ctx.toast(error ? "Envoi impossible, réessayez plus tard." : "Un email pour choisir un nouveau mot de passe vous a été envoyé.", !!error);
    };
  }

  // Retour depuis l'email « mot de passe oublié » : on propose de choisir le nouveau mot de passe.
  function surveillerRecuperation(D, ctx, apres = () => {}) {
    const c = obtenir(D);
    if (!c || c.__surveille) return;
    c.__surveille = true;
    c.auth.onAuthStateChange((evenement) => {
      if (evenement !== "PASSWORD_RECOVERY") return;
      const f = document.getElementById("fenetre");
      f.innerHTML = `
        <form method="dialog" class="pile" style="padding:1.5rem;max-width:420px">
          <h2>Nouveau mot de passe</h2>
          <div class="champ"><label for="srv-nouveau">Mot de passe (10 caractères minimum)</label><input type="password" id="srv-nouveau" minlength="10" required autocomplete="new-password"></div>
          <div class="raccourcis"><button class="btn" value="ok">Enregistrer</button><button class="btn btn-ligne" value="annuler" formnovalidate>Annuler</button></div>
        </form>`;
      f.showModal();
      f.querySelector("form").onsubmit = async (ev) => {
        if (ev.submitter?.value !== "ok") return;
        ev.preventDefault();
        const { error } = await c.auth.updateUser({ password: f.querySelector("#srv-nouveau").value });
        ctx.toast(error ? `Échec : ${error.message}` : "Mot de passe enregistré.", !!error);
        if (!error) {
          f.close();
          apres();
        }
      };
    });
  }

  async function deconnecter(D) {
    await obtenir(D)?.auth.signOut();
  }

  window.AdminServeur = {
    client: obtenir,
    session,
    connecte: async (D) => !!(await session(D)),
    appel,
    ecranConnexion,
    surveillerRecuperation,
    deconnecter,
  };
})();
