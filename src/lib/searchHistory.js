import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'yokhlaa_search_history';
const MAX_HISTORY = 10;

// Lieux de la région de Dakar — base locale complète
export const POPULAR_PLACES = [
  // ══════════════════════════════════════════════
  // ── TRANSPORTS ──
  // ══════════════════════════════════════════════
  { name: 'Aeroport Blaise Diagne (AIBD)', area: 'Diass, Thies', lat: 14.6697, lng: -17.0731, icon: 'airplane' },
  { name: 'Gare des Baux Maraichers', area: 'Pikine', lat: 14.7558, lng: -17.3894, icon: 'bus' },
  { name: 'Gare Routiere Pompiers', area: 'Colobane, Dakar', lat: 14.6892, lng: -17.4508, icon: 'bus' },
  { name: 'Gare de Petersen', area: 'Plateau, Dakar', lat: 14.6735, lng: -17.4385, icon: 'bus' },
  { name: 'Terminal TER Dakar', area: 'Plateau, Dakar', lat: 14.6708, lng: -17.4318, icon: 'train' },
  { name: 'Terminal TER Diamniadio', area: 'Diamniadio', lat: 14.7117, lng: -17.1778, icon: 'train' },
  { name: 'Gare Maritime (Goree)', area: 'Plateau, Dakar', lat: 14.6675, lng: -17.4330, icon: 'boat' },
  { name: 'Port Autonome de Dakar', area: 'Plateau', lat: 14.6780, lng: -17.4275, icon: 'boat' },

  // ══════════════════════════════════════════════
  // ── QUARTIERS & CITÉS — DAKAR VILLE ──
  // ══════════════════════════════════════════════
  { name: 'Plateau', area: 'Centre-ville, Dakar', lat: 14.6697, lng: -17.4362, icon: 'business' },
  { name: 'Medina', area: 'Dakar', lat: 14.6847, lng: -17.4464, icon: 'home' },
  { name: 'Almadies', area: 'Pointe des Almadies', lat: 14.7453, lng: -17.5225, icon: 'home' },
  { name: 'Ngor', area: 'Dakar', lat: 14.7491, lng: -17.5157, icon: 'home' },
  { name: 'Ouakam', area: 'Dakar', lat: 14.7225, lng: -17.4950, icon: 'home' },
  { name: 'Mermoz', area: 'Dakar', lat: 14.7104, lng: -17.4782, icon: 'home' },
  { name: 'Sacre-Coeur 1', area: 'Dakar', lat: 14.7160, lng: -17.4720, icon: 'home' },
  { name: 'Sacre-Coeur 2', area: 'Dakar', lat: 14.7170, lng: -17.4700, icon: 'home' },
  { name: 'Sacre-Coeur 3', area: 'Dakar', lat: 14.7185, lng: -17.4680, icon: 'home' },
  { name: 'Fann', area: 'Dakar', lat: 14.6937, lng: -17.4616, icon: 'home' },
  { name: 'Fann Residence', area: 'Dakar', lat: 14.6920, lng: -17.4640, icon: 'home' },
  { name: 'Fann Hock', area: 'Dakar', lat: 14.6960, lng: -17.4590, icon: 'home' },
  { name: 'Point E', area: 'Dakar', lat: 14.6950, lng: -17.4650, icon: 'home' },
  { name: 'Cite Keur Gorgui', area: 'Mermoz, Dakar', lat: 14.7150, lng: -17.4720, icon: 'home' },
  { name: 'Yoff', area: 'Dakar', lat: 14.7400, lng: -17.4950, icon: 'home' },
  { name: 'Yoff Virage', area: 'Yoff, Dakar', lat: 14.7420, lng: -17.4880, icon: 'home' },
  { name: 'Yoff Tonghor', area: 'Yoff, Dakar', lat: 14.7440, lng: -17.4900, icon: 'home' },
  { name: 'Yoff Diamalaye', area: 'Yoff, Dakar', lat: 14.7460, lng: -17.4860, icon: 'home' },
  { name: 'Yoff Layene', area: 'Yoff, Dakar', lat: 14.7500, lng: -17.5050, icon: 'home' },
  { name: 'Mamelles', area: 'Dakar', lat: 14.7280, lng: -17.5050, icon: 'home' },
  { name: 'Nord Foire', area: 'Dakar', lat: 14.7350, lng: -17.4780, icon: 'home' },
  { name: 'Ouest Foire', area: 'Dakar', lat: 14.7320, lng: -17.4900, icon: 'home' },
  { name: 'Grand Yoff', area: 'Dakar', lat: 14.7350, lng: -17.4600, icon: 'home' },
  { name: 'Camberene', area: 'Dakar', lat: 14.7700, lng: -17.4450, icon: 'home' },
  { name: 'Parcelles Assainies', area: 'Dakar', lat: 14.7614, lng: -17.4318, icon: 'home' },
  { name: 'Parcelles Assainies U1', area: 'Dakar', lat: 14.7600, lng: -17.4350, icon: 'home' },
  { name: 'Parcelles Assainies U2', area: 'Dakar', lat: 14.7590, lng: -17.4320, icon: 'home' },
  { name: 'Parcelles Assainies U6', area: 'Dakar', lat: 14.7620, lng: -17.4280, icon: 'home' },
  { name: 'Parcelles Assainies U10', area: 'Dakar', lat: 14.7640, lng: -17.4250, icon: 'home' },
  { name: 'Parcelles Assainies U12', area: 'Dakar', lat: 14.7650, lng: -17.4230, icon: 'home' },
  { name: 'Parcelles Assainies U13', area: 'Dakar', lat: 14.7660, lng: -17.4210, icon: 'home' },
  { name: 'Parcelles Assainies U14', area: 'Dakar', lat: 14.7665, lng: -17.4200, icon: 'home' },
  { name: 'Parcelles Assainies U17', area: 'Dakar', lat: 14.7680, lng: -17.4180, icon: 'home' },
  { name: 'Parcelles Assainies U19', area: 'Dakar', lat: 14.7690, lng: -17.4160, icon: 'home' },
  { name: 'Parcelles Assainies U26', area: 'Dakar', lat: 14.7710, lng: -17.4140, icon: 'home' },
  { name: 'Patte d\'Oie', area: 'Dakar', lat: 14.7350, lng: -17.4450, icon: 'home' },
  { name: 'Patte d\'Oie Builders', area: 'Dakar', lat: 14.7360, lng: -17.4430, icon: 'home' },
  { name: 'Colobane', area: 'Dakar', lat: 14.6892, lng: -17.4508, icon: 'home' },
  { name: 'Grand Dakar', area: 'Dakar', lat: 14.6920, lng: -17.4350, icon: 'home' },
  { name: 'Biscuiterie', area: 'Grand Dakar', lat: 14.6940, lng: -17.4380, icon: 'home' },
  { name: 'Rebeuss', area: 'Dakar', lat: 14.6770, lng: -17.4420, icon: 'home' },
  { name: 'Gibraltar', area: 'Medina, Dakar', lat: 14.6830, lng: -17.4450, icon: 'home' },
  { name: 'Gueule Tapee', area: 'Medina, Dakar', lat: 14.6890, lng: -17.4550, icon: 'home' },
  { name: 'Corniche', area: 'Dakar', lat: 14.6900, lng: -17.4650, icon: 'home' },
  { name: 'Fenetre Mermoz', area: 'Mermoz, Dakar', lat: 14.7090, lng: -17.4800, icon: 'home' },
  { name: 'Castors', area: 'Dakar', lat: 14.7150, lng: -17.4420, icon: 'home' },
  { name: 'Derklé', area: 'Dakar', lat: 14.7130, lng: -17.4460, icon: 'home' },

  // ── Libertés ──
  { name: 'Liberte 1', area: 'Dakar', lat: 14.7050, lng: -17.4520, icon: 'home' },
  { name: 'Liberte 2', area: 'Dakar', lat: 14.7060, lng: -17.4530, icon: 'home' },
  { name: 'Liberte 3', area: 'Dakar', lat: 14.7080, lng: -17.4540, icon: 'home' },
  { name: 'Liberte 4', area: 'Dakar', lat: 14.7100, lng: -17.4550, icon: 'home' },
  { name: 'Liberte 5', area: 'Dakar', lat: 14.7120, lng: -17.4560, icon: 'home' },
  { name: 'Liberte 6', area: 'Dakar', lat: 14.7150, lng: -17.4550, icon: 'home' },

  // ── HLM ──
  { name: 'HLM', area: 'Dakar', lat: 14.7020, lng: -17.4470, icon: 'home' },
  { name: 'HLM 1', area: 'Dakar', lat: 14.7000, lng: -17.4460, icon: 'home' },
  { name: 'HLM 2', area: 'Dakar', lat: 14.7010, lng: -17.4475, icon: 'home' },
  { name: 'HLM 3', area: 'Dakar', lat: 14.7025, lng: -17.4480, icon: 'home' },
  { name: 'HLM 5', area: 'Dakar', lat: 14.7040, lng: -17.4490, icon: 'home' },
  { name: 'HLM Grand Medine', area: 'Dakar', lat: 14.7060, lng: -17.4500, icon: 'home' },
  { name: 'HLM Grand Yoff', area: 'Grand Yoff', lat: 14.7340, lng: -17.4610, icon: 'home' },
  { name: 'HLM Las Palmas', area: 'Dakar', lat: 14.7050, lng: -17.4510, icon: 'home' },
  { name: 'HLM Montagne', area: 'Dakar', lat: 14.7055, lng: -17.4505, icon: 'home' },

  // ── SICAP ──
  { name: 'Sicap Baobab', area: 'Dakar', lat: 14.7080, lng: -17.4580, icon: 'home' },
  { name: 'Sicap Foire', area: 'Dakar', lat: 14.7100, lng: -17.4600, icon: 'home' },
  { name: 'Sicap Liberte', area: 'Dakar', lat: 14.7110, lng: -17.4570, icon: 'home' },
  { name: 'Sicap Mermoz', area: 'Dakar', lat: 14.7090, lng: -17.4750, icon: 'home' },
  { name: 'Sicap Karack', area: 'Dakar', lat: 14.7070, lng: -17.4560, icon: 'home' },
  { name: 'Sicap Rue 10', area: 'Dakar', lat: 14.7095, lng: -17.4590, icon: 'home' },
  { name: 'Sicap Dieuppeul', area: 'Dakar', lat: 14.7100, lng: -17.4480, icon: 'home' },
  { name: 'Sicap Amitie 1', area: 'Dakar', lat: 14.7115, lng: -17.4610, icon: 'home' },
  { name: 'Sicap Amitie 2', area: 'Dakar', lat: 14.7125, lng: -17.4620, icon: 'home' },
  { name: 'Sicap Amitie 3', area: 'Dakar', lat: 14.7135, lng: -17.4630, icon: 'home' },

  // ── Cités connues ──
  { name: 'Cite Versailles', area: 'Medina, Dakar', lat: 14.6830, lng: -17.4500, icon: 'home' },
  { name: 'Cite Diamalaye', area: 'Yoff, Dakar', lat: 14.7480, lng: -17.4850, icon: 'home' },
  { name: 'Cite Comico', area: 'Yoff, Dakar', lat: 14.7380, lng: -17.4680, icon: 'home' },
  { name: 'Cite des Magistrats', area: 'Mermoz, Dakar', lat: 14.7110, lng: -17.4760, icon: 'home' },
  { name: 'Cite Aliou Sow', area: 'Ouakam, Dakar', lat: 14.7250, lng: -17.4980, icon: 'home' },
  { name: 'Cite Asecna', area: 'Yoff, Dakar', lat: 14.7370, lng: -17.4830, icon: 'home' },
  { name: 'Cite Biagui', area: 'Yoff, Dakar', lat: 14.7390, lng: -17.4750, icon: 'home' },
  { name: 'Cite Air Afrique', area: 'Yoff, Dakar', lat: 14.7360, lng: -17.4810, icon: 'home' },
  { name: 'Cite Mixta', area: 'Dakar', lat: 14.7200, lng: -17.4710, icon: 'home' },
  { name: 'Cite Sonatel', area: 'Dakar', lat: 14.7230, lng: -17.4690, icon: 'home' },
  { name: 'Cite Police', area: 'Dakar', lat: 14.7220, lng: -17.4670, icon: 'home' },
  { name: 'Cite SHS', area: 'Ouakam, Dakar', lat: 14.7210, lng: -17.4960, icon: 'home' },
  { name: 'Cite Tobago', area: 'Yoff, Dakar', lat: 14.7395, lng: -17.4760, icon: 'home' },
  { name: 'Cite ISRA', area: 'Hann, Dakar', lat: 14.7260, lng: -17.4300, icon: 'home' },
  { name: 'Cite Millionnaire', area: 'Guediawaye', lat: 14.7770, lng: -17.3980, icon: 'home' },
  { name: 'Cite Soprim', area: 'Pikine', lat: 14.7550, lng: -17.3880, icon: 'home' },
  { name: 'Cite Serigne Mansour Sy', area: 'Pikine', lat: 14.7540, lng: -17.3850, icon: 'home' },
  { name: 'Cite Alia', area: 'Pikine', lat: 14.7570, lng: -17.3860, icon: 'home' },
  { name: 'Cite Darou Salam', area: 'Pikine', lat: 14.7530, lng: -17.3870, icon: 'home' },
  { name: 'Cite Djily Mbaye', area: 'Parcelles, Dakar', lat: 14.7630, lng: -17.4260, icon: 'home' },
  { name: 'Cite Impots et Domaines', area: 'Camberene', lat: 14.7680, lng: -17.4400, icon: 'home' },
  { name: 'Cite Canada', area: 'Guediawaye', lat: 14.7780, lng: -17.3960, icon: 'home' },
  { name: 'Cite Darou Rahmane', area: 'Guediawaye', lat: 14.7760, lng: -17.3940, icon: 'home' },
  { name: 'Cite Elarton', area: 'Guediawaye', lat: 14.7790, lng: -17.3920, icon: 'home' },

  // ══════════════════════════════════════════════
  // ── BANLIEUE — PIKINE / GUEDIAWAYE / KEUR MASSAR ──
  // ══════════════════════════════════════════════
  { name: 'Pikine', area: 'Banlieue, Dakar', lat: 14.7558, lng: -17.3894, icon: 'home' },
  { name: 'Pikine Tally Boubess', area: 'Pikine', lat: 14.7530, lng: -17.3910, icon: 'home' },
  { name: 'Pikine Tally Boumack', area: 'Pikine', lat: 14.7520, lng: -17.3920, icon: 'home' },
  { name: 'Pikine Icotaf', area: 'Pikine', lat: 14.7510, lng: -17.3930, icon: 'home' },
  { name: 'Pikine Guinaw Rail', area: 'Pikine', lat: 14.7480, lng: -17.3860, icon: 'home' },
  { name: 'Pikine Guinaw Rail Nord', area: 'Pikine', lat: 14.7500, lng: -17.3840, icon: 'home' },
  { name: 'Pikine Rue 10', area: 'Pikine', lat: 14.7545, lng: -17.3885, icon: 'home' },
  { name: 'Pikine Extension', area: 'Pikine', lat: 14.7590, lng: -17.3870, icon: 'home' },
  { name: 'Diamaguene', area: 'Pikine', lat: 14.7570, lng: -17.3920, icon: 'home' },
  { name: 'Thiaroye', area: 'Banlieue, Dakar', lat: 14.7450, lng: -17.3700, icon: 'home' },
  { name: 'Thiaroye Gare', area: 'Thiaroye', lat: 14.7440, lng: -17.3720, icon: 'home' },
  { name: 'Thiaroye Sur Mer', area: 'Thiaroye', lat: 14.7350, lng: -17.3750, icon: 'home' },
  { name: 'Thiaroye Azur', area: 'Thiaroye', lat: 14.7470, lng: -17.3730, icon: 'home' },
  { name: 'Guediawaye', area: 'Banlieue, Dakar', lat: 14.7742, lng: -17.4000, icon: 'home' },
  { name: 'Golf Sud', area: 'Guediawaye', lat: 14.7720, lng: -17.4020, icon: 'home' },
  { name: 'Sam Notaire', area: 'Guediawaye', lat: 14.7730, lng: -17.3990, icon: 'home' },
  { name: 'Wakhinane Nimzatt', area: 'Guediawaye', lat: 14.7750, lng: -17.4030, icon: 'home' },
  { name: 'Ndiareme Limamoulaye', area: 'Guediawaye', lat: 14.7710, lng: -17.4050, icon: 'home' },
  { name: 'Medina Gounass', area: 'Guediawaye', lat: 14.7800, lng: -17.3900, icon: 'home' },
  { name: 'Keur Massar', area: 'Banlieue, Dakar', lat: 14.7833, lng: -17.3167, icon: 'home' },
  { name: 'Keur Massar Nord', area: 'Keur Massar', lat: 14.7900, lng: -17.3150, icon: 'home' },
  { name: 'Keur Massar Extension', area: 'Keur Massar', lat: 14.7850, lng: -17.3100, icon: 'home' },
  { name: 'Yeumbeul', area: 'Banlieue, Dakar', lat: 14.7800, lng: -17.3500, icon: 'home' },
  { name: 'Yeumbeul Nord', area: 'Banlieue', lat: 14.7830, lng: -17.3480, icon: 'home' },
  { name: 'Yeumbeul Sud', area: 'Banlieue', lat: 14.7780, lng: -17.3520, icon: 'home' },
  { name: 'Malika', area: 'Banlieue', lat: 14.7900, lng: -17.3250, icon: 'home' },
  { name: 'Mbao', area: 'Banlieue', lat: 14.7300, lng: -17.3300, icon: 'home' },
  { name: 'Petit Mbao', area: 'Banlieue', lat: 14.7320, lng: -17.3350, icon: 'home' },
  { name: 'Grand Mbao', area: 'Banlieue', lat: 14.7280, lng: -17.3250, icon: 'home' },
  { name: 'Hann', area: 'Dakar', lat: 14.7260, lng: -17.4280, icon: 'home' },
  { name: 'Hann Bel Air', area: 'Dakar', lat: 14.7240, lng: -17.4300, icon: 'home' },
  { name: 'Hann Mariste', area: 'Dakar', lat: 14.7270, lng: -17.4250, icon: 'home' },
  { name: 'Hann Village', area: 'Dakar', lat: 14.7290, lng: -17.4230, icon: 'home' },

  // ── Rufisque / Diamniadio ──
  { name: 'Rufisque', area: 'Rufisque', lat: 14.7167, lng: -17.2667, icon: 'home' },
  { name: 'Rufisque Centre', area: 'Rufisque', lat: 14.7180, lng: -17.2680, icon: 'home' },
  { name: 'Rufisque Est', area: 'Rufisque', lat: 14.7200, lng: -17.2600, icon: 'home' },
  { name: 'Rufisque Nord', area: 'Rufisque', lat: 14.7250, lng: -17.2700, icon: 'home' },
  { name: 'Bargny', area: 'Rufisque', lat: 14.6975, lng: -17.2328, icon: 'home' },
  { name: 'Diamniadio', area: 'Rufisque', lat: 14.7117, lng: -17.1778, icon: 'home' },
  { name: 'Sebikhotane', area: 'Rufisque', lat: 14.7394, lng: -17.1350, icon: 'home' },
  { name: 'Sangalkam', area: 'Rufisque', lat: 14.7800, lng: -17.2280, icon: 'home' },
  { name: 'Jaxaay', area: 'Rufisque', lat: 14.7600, lng: -17.3100, icon: 'home' },
  { name: 'Tivaouane Peulh', area: 'Rufisque', lat: 14.7850, lng: -17.2700, icon: 'home' },
  { name: 'Niaga', area: 'Rufisque', lat: 14.8200, lng: -17.2400, icon: 'home' },

  // ══════════════════════════════════════════════
  // ── MARCHÉS ──
  // ══════════════════════════════════════════════
  { name: 'Marche Sandaga', area: 'Plateau, Dakar', lat: 14.6723, lng: -17.4394, icon: 'cart' },
  { name: 'Marche Kermel', area: 'Plateau, Dakar', lat: 14.6680, lng: -17.4370, icon: 'cart' },
  { name: 'Marche HLM', area: 'HLM, Dakar', lat: 14.7010, lng: -17.4460, icon: 'cart' },
  { name: 'Marche Tilene', area: 'Medina, Dakar', lat: 14.6860, lng: -17.4500, icon: 'cart' },
  { name: 'Marche Colobane', area: 'Colobane, Dakar', lat: 14.6900, lng: -17.4520, icon: 'cart' },
  { name: 'Marche Castor', area: 'Castor, Dakar', lat: 14.7150, lng: -17.4420, icon: 'cart' },
  { name: 'Marche Thiaroye', area: 'Thiaroye', lat: 14.7450, lng: -17.3720, icon: 'cart' },
  { name: 'Marche Syndicat Pikine', area: 'Pikine', lat: 14.7570, lng: -17.3900, icon: 'cart' },
  { name: 'Marche Grand Yoff', area: 'Grand Yoff', lat: 14.7340, lng: -17.4580, icon: 'cart' },
  { name: 'Marche Zinc Guediawaye', area: 'Guediawaye', lat: 14.7740, lng: -17.4010, icon: 'cart' },
  { name: 'Marche Boubess', area: 'Pikine', lat: 14.7525, lng: -17.3915, icon: 'cart' },
  { name: 'Marche Rufisque', area: 'Rufisque', lat: 14.7170, lng: -17.2670, icon: 'cart' },
  { name: 'Marche Ngor', area: 'Ngor', lat: 14.7495, lng: -17.5150, icon: 'cart' },
  { name: 'Marche Ouakam', area: 'Ouakam', lat: 14.7230, lng: -17.4940, icon: 'cart' },
  { name: 'Marche Yoff', area: 'Yoff', lat: 14.7410, lng: -17.4940, icon: 'cart' },

  // ══════════════════════════════════════════════
  // ── CENTRES COMMERCIAUX & SUPERMARCHÉS ──
  // ══════════════════════════════════════════════
  { name: 'Sea Plaza', area: 'Corniche, Dakar', lat: 14.6968, lng: -17.4693, icon: 'storefront' },
  { name: 'Centre Commercial Sahm', area: 'Sacre-Coeur', lat: 14.7180, lng: -17.4710, icon: 'storefront' },
  { name: 'City Mall Dakar', area: 'Corniche', lat: 14.6960, lng: -17.4670, icon: 'storefront' },
  { name: 'Auchan Mermoz', area: 'Mermoz, Dakar', lat: 14.7100, lng: -17.4770, icon: 'storefront' },
  { name: 'Auchan Sacre-Coeur', area: 'Sacre-Coeur', lat: 14.7190, lng: -17.4680, icon: 'storefront' },
  { name: 'Auchan Ouakam', area: 'Ouakam', lat: 14.7240, lng: -17.4930, icon: 'storefront' },
  { name: 'Auchan Keur Massar', area: 'Keur Massar', lat: 14.7830, lng: -17.3200, icon: 'storefront' },
  { name: 'Auchan Pikine', area: 'Pikine', lat: 14.7555, lng: -17.3890, icon: 'storefront' },
  { name: 'Auchan Grand Yoff', area: 'Grand Yoff', lat: 14.7345, lng: -17.4590, icon: 'storefront' },
  { name: 'Auchan Parcelles', area: 'Parcelles Assainies', lat: 14.7610, lng: -17.4310, icon: 'storefront' },
  { name: 'Auchan Liberte', area: 'Liberte', lat: 14.7140, lng: -17.4540, icon: 'storefront' },
  { name: 'Casino Supermarche', area: 'Plateau', lat: 14.6710, lng: -17.4350, icon: 'storefront' },
  { name: 'Exclusive Supermarche', area: 'Almadies', lat: 14.7440, lng: -17.5200, icon: 'storefront' },

  // ══════════════════════════════════════════════
  // ── UNIVERSITÉS & ÉCOLES ──
  // ══════════════════════════════════════════════
  { name: 'Universite Cheikh Anta Diop (UCAD)', area: 'Fann, Dakar', lat: 14.6937, lng: -17.4616, icon: 'school' },
  { name: 'Universite Amadou Mahtar Mbow', area: 'Diamniadio', lat: 14.7130, lng: -17.1800, icon: 'school' },
  { name: 'ISM (Institut Superieur de Management)', area: 'Dakar', lat: 14.7050, lng: -17.4580, icon: 'school' },
  { name: 'IAM (Institut Africain de Management)', area: 'Mermoz', lat: 14.7100, lng: -17.4750, icon: 'school' },
  { name: 'Ecole Superieure Polytechnique', area: 'Fann, Dakar', lat: 14.6950, lng: -17.4630, icon: 'school' },
  { name: 'BEM Dakar', area: 'Almadies', lat: 14.7430, lng: -17.5180, icon: 'school' },
  { name: 'Lycee John F. Kennedy', area: 'Dakar', lat: 14.7050, lng: -17.4500, icon: 'school' },
  { name: 'Lycee Lamine Gueye', area: 'Plateau', lat: 14.6750, lng: -17.4380, icon: 'school' },
  { name: 'Lycee Seydou Nourou Tall', area: 'Grand Dakar', lat: 14.6930, lng: -17.4370, icon: 'school' },
  { name: 'Lycee Maurice Delafosse', area: 'Fann, Dakar', lat: 14.6930, lng: -17.4590, icon: 'school' },
  { name: 'Lycee Limamoulaye', area: 'Guediawaye', lat: 14.7730, lng: -17.3995, icon: 'school' },
  { name: 'ESMT', area: 'Corniche, Dakar', lat: 14.6980, lng: -17.4680, icon: 'school' },
  { name: 'Ecole Centrale Dakar', area: 'Diamniadio', lat: 14.7125, lng: -17.1790, icon: 'school' },
  { name: 'SUP DE CO Dakar', area: 'Sacre-Coeur', lat: 14.7175, lng: -17.4695, icon: 'school' },

  // ══════════════════════════════════════════════
  // ── HÔPITAUX & CLINIQUES ──
  // ══════════════════════════════════════════════
  { name: 'Hopital Principal', area: 'Plateau, Dakar', lat: 14.6703, lng: -17.4325, icon: 'medkit' },
  { name: 'Hopital Fann', area: 'Fann, Dakar', lat: 14.6953, lng: -17.4650, icon: 'medkit' },
  { name: 'Hopital Aristide Le Dantec', area: 'Plateau, Dakar', lat: 14.6790, lng: -17.4530, icon: 'medkit' },
  { name: 'Hopital de Grand Yoff (HOGGY)', area: 'Grand Yoff', lat: 14.7340, lng: -17.4560, icon: 'medkit' },
  { name: 'Hopital Dalal Jamm', area: 'Guediawaye', lat: 14.7750, lng: -17.3950, icon: 'medkit' },
  { name: 'Hopital Roi Baudouin', area: 'Guediawaye', lat: 14.7760, lng: -17.3980, icon: 'medkit' },
  { name: 'Hopital Abass Ndao', area: 'Medina', lat: 14.6850, lng: -17.4480, icon: 'medkit' },
  { name: 'Hopital de Pikine', area: 'Pikine', lat: 14.7560, lng: -17.3900, icon: 'medkit' },
  { name: 'Hopital Youssou Mbargane', area: 'Rufisque', lat: 14.7175, lng: -17.2660, icon: 'medkit' },
  { name: 'Hopital de Diamniadio', area: 'Diamniadio', lat: 14.7120, lng: -17.1780, icon: 'medkit' },
  { name: 'Clinique de la Madeleine', area: 'Plateau', lat: 14.6720, lng: -17.4450, icon: 'medkit' },
  { name: 'Clinique Suma', area: 'Almadies', lat: 14.7440, lng: -17.5170, icon: 'medkit' },
  { name: 'Clinique Casahous', area: 'Liberté', lat: 14.7120, lng: -17.4550, icon: 'medkit' },
  { name: 'Centre Hospitalier de Fann', area: 'Fann', lat: 14.6945, lng: -17.4655, icon: 'medkit' },
  { name: 'Institut Pasteur Dakar', area: 'Plateau', lat: 14.6740, lng: -17.4380, icon: 'medkit' },
  { name: 'Philippe Senghor (Centre de Sante)', area: 'Yoff', lat: 14.7410, lng: -17.4930, icon: 'medkit' },

  // ══════════════════════════════════════════════
  // ── MONUMENTS / TOURISME / PLAGES ──
  // ══════════════════════════════════════════════
  { name: 'Monument de la Renaissance', area: 'Ouakam, Dakar', lat: 14.7225, lng: -17.4950, icon: 'trophy' },
  { name: 'Place de l\'Independance', area: 'Plateau, Dakar', lat: 14.6697, lng: -17.4362, icon: 'flag' },
  { name: 'Ile de Goree', area: 'Goree, Dakar', lat: 14.6672, lng: -17.3975, icon: 'boat' },
  { name: 'Mosquee de la Divinite', area: 'Ouakam', lat: 14.7250, lng: -17.5100, icon: 'star' },
  { name: 'Grande Mosquee de Dakar', area: 'Plateau', lat: 14.6820, lng: -17.4440, icon: 'star' },
  { name: 'Cathedrale du Souvenir Africain', area: 'Plateau', lat: 14.6770, lng: -17.4440, icon: 'star' },
  { name: 'Phare des Mamelles', area: 'Mamelles', lat: 14.7260, lng: -17.5100, icon: 'star' },
  { name: 'Village des Arts', area: 'Fann', lat: 14.6980, lng: -17.4650, icon: 'color-palette' },
  { name: 'Musee Theodore Monod (IFAN)', area: 'Plateau', lat: 14.6700, lng: -17.4370, icon: 'color-palette' },
  { name: 'Lac Rose (Lac Retba)', area: 'Niaga', lat: 14.8370, lng: -17.2330, icon: 'water' },
  { name: 'Plage de Ngor', area: 'Ngor', lat: 14.7491, lng: -17.5157, icon: 'umbrella' },
  { name: 'Plage de Yoff', area: 'Yoff', lat: 14.7450, lng: -17.4980, icon: 'umbrella' },
  { name: 'Plage de Virage', area: 'Yoff', lat: 14.7430, lng: -17.4900, icon: 'umbrella' },
  { name: 'Plage de Bceao', area: 'Almadies', lat: 14.7460, lng: -17.5190, icon: 'umbrella' },

  // ── Lieux administratifs ──
  { name: 'Palais de la Republique', area: 'Plateau', lat: 14.6650, lng: -17.4340, icon: 'flag' },
  { name: 'Assemblee Nationale', area: 'Plateau', lat: 14.6690, lng: -17.4320, icon: 'flag' },
  { name: 'Prefecture de Dakar', area: 'Plateau', lat: 14.6710, lng: -17.4380, icon: 'business' },
  { name: 'Tribunal de Dakar', area: 'Plateau', lat: 14.6740, lng: -17.4360, icon: 'business' },
  { name: 'Mairie de Dakar', area: 'Plateau', lat: 14.6695, lng: -17.4345, icon: 'business' },
  { name: 'Gouvernance de Dakar', area: 'Plateau', lat: 14.6680, lng: -17.4355, icon: 'business' },
  { name: 'Direction Generale des Impots', area: 'Plateau', lat: 14.6730, lng: -17.4340, icon: 'business' },
  { name: 'BCEAO (Banque Centrale)', area: 'Plateau', lat: 14.6660, lng: -17.4330, icon: 'business' },

  // ── Stades et sport ──
  { name: 'Stade Abdoulaye Wade', area: 'Diamniadio', lat: 14.7040, lng: -17.1730, icon: 'football' },
  { name: 'Stade Leopold Sedar Senghor', area: 'Medina', lat: 14.6880, lng: -17.4560, icon: 'football' },
  { name: 'Stade Demba Diop', area: 'Medina', lat: 14.6860, lng: -17.4480, icon: 'football' },
  { name: 'Stade Iba Mar Diop', area: 'Medina', lat: 14.6840, lng: -17.4500, icon: 'football' },

  // ── Hotels ──
  { name: 'Radisson Blu Dakar', area: 'Sea Plaza, Corniche', lat: 14.6970, lng: -17.4690, icon: 'bed' },
  { name: 'Terrou-Bi', area: 'Corniche Ouest', lat: 14.7000, lng: -17.4750, icon: 'bed' },
  { name: 'King Fahd Palace', area: 'Almadies', lat: 14.7420, lng: -17.5160, icon: 'bed' },
  { name: 'Pullman Dakar Teranga', area: 'Plateau', lat: 14.6700, lng: -17.4340, icon: 'bed' },
  { name: 'Novotel Dakar', area: 'Plateau', lat: 14.6680, lng: -17.4310, icon: 'bed' },
  { name: 'Hotel Ndiambour', area: 'Plateau', lat: 14.6720, lng: -17.4370, icon: 'bed' },
  { name: 'Onomo Hotel Dakar', area: 'Plateau', lat: 14.6690, lng: -17.4330, icon: 'bed' },

  // ══════════════════════════════════════════════
  // ── AXES ROUTIERS MAJEURS ──
  // ══════════════════════════════════════════════
  { name: 'Rond-point Jet d\'Eau', area: 'Medina, Dakar', lat: 14.6870, lng: -17.4500, icon: 'navigate' },
  { name: 'Rond-point Cyrnos', area: 'Medina, Dakar', lat: 14.6900, lng: -17.4530, icon: 'navigate' },
  { name: 'Rond-point Liberte 5', area: 'Liberte', lat: 14.7130, lng: -17.4560, icon: 'navigate' },
  { name: 'Rond-point Liberte 6', area: 'Liberte', lat: 14.7155, lng: -17.4555, icon: 'navigate' },
  { name: 'Echangeur de la Patte d\'Oie', area: 'Patte d\'Oie', lat: 14.7350, lng: -17.4460, icon: 'navigate' },
  { name: 'Echangeur Keur Massar', area: 'Keur Massar', lat: 14.7835, lng: -17.3170, icon: 'navigate' },
  { name: 'Autoroute a Peage', area: 'Dakar - Diamniadio', lat: 14.7400, lng: -17.4000, icon: 'navigate' },
  { name: 'VDN (Voie de Degagement Nord)', area: 'Dakar', lat: 14.7247, lng: -17.4753, icon: 'navigate' },
  { name: 'Route de l\'Aeroport', area: 'Yoff', lat: 14.7430, lng: -17.4870, icon: 'navigate' },
  { name: 'Route de Ouakam', area: 'Ouakam', lat: 14.7200, lng: -17.4920, icon: 'navigate' },
  { name: 'Corniche Ouest', area: 'Dakar', lat: 14.6950, lng: -17.4700, icon: 'navigate' },
  { name: 'Corniche Est', area: 'Hann', lat: 14.7220, lng: -17.4200, icon: 'navigate' },
  { name: 'Avenue Cheikh Anta Diop', area: 'Dakar', lat: 14.7050, lng: -17.4650, icon: 'navigate' },
  { name: 'Avenue Bourguiba', area: 'Plateau', lat: 14.6750, lng: -17.4400, icon: 'navigate' },
  { name: 'Avenue Blaise Diagne', area: 'Medina', lat: 14.6870, lng: -17.4460, icon: 'navigate' },
  { name: 'Route de Ngor', area: 'Ngor', lat: 14.7480, lng: -17.5130, icon: 'navigate' },
  { name: 'Route des Almadies', area: 'Almadies', lat: 14.7430, lng: -17.5150, icon: 'navigate' },
];

/**
 * Load search history from storage
 */
export async function getSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save a destination to search history
 */
export async function addToSearchHistory(place) {
  try {
    const history = await getSearchHistory();
    // Remove duplicate if exists
    const filtered = history.filter(
      h => !(Math.abs(h.lat - place.lat) < 0.001 && Math.abs(h.lng - place.lng) < 0.001)
    );
    // Add to front
    const updated = [
      { name: place.name, area: place.area || '', lat: place.lat, lng: place.lng, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear search history
 */
export async function clearSearchHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}
