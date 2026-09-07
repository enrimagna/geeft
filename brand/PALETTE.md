# Geeft — color palette

Versione chiusa: **Slate + Peach**. Uso generico (compleanni, nascite, matrimoni, liste famiglia). **Niente Natale**: evitare rosso+verde, alberi, neve, oro da addobbo.

## Token

| Token     | Hex       | RGB           | Ruolo                                     |
| --------- | --------- | ------------- | ----------------------------------------- |
| **Slate** | `#5C6B7A` | 92, 107, 122  | Primario: pacco, superfici scure, bottoni |
| **Peach** | `#E8A87C` | 232, 168, 124 | Accento: nastro, fiocco, highlight attivi |
| **Mist**  | `#EDE8E1` | 237, 232, 225 | Superfici, card, divider soft             |
| **Ink**   | `#1C1917` | 28, 25, 23    | Testo, wordmark                           |
| **Paper** | `#FAF7F2` | 250, 247, 242 | Fondi pagina / icone chiare               |

## Coppie utili

- Slate su Paper — logo e mark su fondo chiaro
- Peach su Slate — nastro sul pacco (icona app)
- Ink su Paper — body text
- Peach su Paper — CTA soft / badge
- Mist su Paper — card e superfici

## Contrasto (indicativo)

- Ink su Paper: alto, testo lungo
- Slate su Paper: buono per mark e titoli
- Peach su Slate: accento, non testo lungo
- Peach su Paper: ok per label/icone, non body

## CSS / Tailwind hint

```css
:root {
	--geeft-slate: #5c6b7a;
	--geeft-peach: #e8a87c;
	--geeft-mist: #ede8e1;
	--geeft-ink: #1c1917;
	--geeft-paper: #faf7f2;
}
```

## Scarti

- Clay `#C45C26` — proposta precedente, scartata
- Cartellino come mark — scartato; mark = pacco geometrico
