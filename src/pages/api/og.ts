import type { APIRoute } from 'astro';
import satori from 'satori';
import { svg2png, initialize } from 'svg2png-wasm';
import { readFileSync, writeFileSync } from 'node:fs';

await initialize(
  readFileSync('./node_modules/svg2png-wasm/svg2png_wasm_bg.wasm'),
);

const colorSchemes = {
  blue: { primary: '#3b82f6', secondary: '#1e40af', accent: '#dbeafe' },
  purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ede9fe' },
  orange: { primary: '#f97316', secondary: '#ea580c', accent: '#fed7aa' },
  green: { primary: '#10b981', secondary: '#059669', accent: '#d1fae5' },
  red: { primary: '#ef4444', secondary: '#dc2626', accent: '#fecaca' }
};

export async function loadGoogleFont({
  family,
  weight,
  text,
}: {
  family: string;
  weight?: number;
  text?: string;
}) {
  const params: Record<string, string> = {
    family: `${encodeURIComponent(family)}${weight ? `:wght@${weight}` : ""}`,
  };

  if (text) {
    // URL-encode the text to handle special characters like '%'
    params.text = encodeURIComponent(text);
  } else {
    // Load the Japanese subset to support a wide range of characters including symbols.
    params.subset = "japanese";
  }

  const url = `https://fonts.googleapis.com/css2?${Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&")}`;

  const res = await fetch(url, {
    headers: {
      // construct user agent to get TTF font
      "User-Agent":
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
    },
  });

  const body = await res.text();
  // Get the font URL from the CSS text
  const fontUrl = body.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  )?.[1];

  if (!fontUrl) {
    throw new Error("Could not find font URL");
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const keyboardName = formData.get('keyboardName')?.toString() || 'My Keyboard';
    const owner = formData.get('owner')?.toString();
    const switches = formData.get('switches')?.toString();
    const keycaps = formData.get('keycaps')?.toString();
    const layout = formData.get('layout')?.toString();
    const colorSchemeKey = formData.get('colorScheme')?.toString() as keyof typeof colorSchemes || 'blue';
    const description = formData.get('description')?.toString();
    const photoFile = formData.get('keyboardPhoto') as File;

    const colorScheme = colorSchemes[colorSchemeKey];

    let photoDataUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      photoDataUrl = `data:${photoFile.type};base64,${base64}`;
    }

    const plexSansJPRegular = await loadGoogleFont({ family: 'IBM Plex Sans JP', weight: 400 });
    const plexSansJPBold = await loadGoogleFont({ family: 'IBM Plex Sans JP', weight: 700 });

    const html = {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"IBM Plex Sans JP"',
          position: 'relative',
          color: '#1f2937', // Darker gray for better contrast
        },
        children: [
          // Background Gradient
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${colorScheme.accent} 0%, #ffffff 100%)`,
                zIndex: -2,
              }
            }
          },
          // Background Photo
          (photoDataUrl && photoDataUrl.trim() !== '') && {
            type: 'img',
            props: {
              src: photoDataUrl,
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1, // Photo is main visual
                zIndex: -1,
              }
            }
          },
          // Overlay for text readability
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // Increased opacity
                zIndex: 0,
              }
            }
          },
          // Main Content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Pushes content to top, middle, bottom
                width: '100%',
                height: '100%',
                padding: '80px',
                zIndex: 1,
              },
              children: [
                // Top Section: Keyboard Name & Owner
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '110px', // Much larger font size
                            fontWeight: 'bold',
                            color: colorScheme.primary,
                            lineHeight: '1.1',
                          },
                          children: keyboardName,
                        }
                      },
                      (owner && owner.trim() !== '') && {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: colorScheme.secondary,
                            marginTop: '10px',
                          },
                          children: `by ${owner}`,
                        }
                      },
                    ].filter(Boolean)
                  }
                },

                // Middle Section: Specs
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      fontSize: '52px', // Larger base font size for specs
                      marginTop: '40px', // Add space from top
                      marginBottom: '40px', // Add space from bottom
                    },
                    children: [
                      (switches && switches.trim() !== '') && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'baseline', marginBottom: '20px' }, // Increased margin
                          children: [
                            { type: 'span', props: { style: { fontWeight: 'bold', color: colorScheme.secondary, width: '220px', fontSize: '48px' }, children: 'Switches' } },
                            { type: 'span', props: { children: switches } }
                          ]
                        }
                      },
                      (keycaps && keycaps.trim() !== '') && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'baseline', marginBottom: '20px' }, // Increased margin
                          children: [
                            { type: 'span', props: { style: { fontWeight: 'bold', color: colorScheme.secondary, width: '220px', fontSize: '48px' }, children: 'Keycaps' } },
                            { type: 'span', props: { children: keycaps } }
                          ]
                        }
                      },
                      (layout && layout.trim() !== '') && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'baseline', marginBottom: '20px' }, // Increased margin
                          children: [
                            { type: 'span', props: { style: { fontWeight: 'bold', color: colorScheme.secondary, width: '220px', fontSize: '48px' }, children: 'Layout' } },
                            { type: 'span', props: { children: layout } }
                          ]
                        }
                      },
                    ].filter(Boolean)
                  }
                },

                // Bottom Section: Description
                (description && description.trim() !== '') && {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '32px', // Smaller, but readable
                      color: '#4b5563', // Slightly lighter gray
                      textAlign: 'left',
                      width: '100%',
                      lineHeight: '1.5', // Better line spacing
                    },
                    children: description,
                  }
                }
              ].filter(Boolean)
            }
          }
        ].filter(Boolean)
      }
    };

    const svg = await satori(html, {
      width: 1748,
      height: 1240,
      fonts: [
        {
          name: 'IBM Plex Sans JP',
          data: plexSansJPRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'IBM Plex Sans JP',
          data: plexSansJPBold,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // const resvg = new Resvg(svg, {
    //   fitTo: {
    //     mode: 'width',
    //     value: 1748,
    //   },
    // });

    // const pngData = resvg.render();
    // const pngBuffer = pngData.asPng();

    const pngBuffer = await svg2png(svg)

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      status: 200,
    });

  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return new Response(e.message, { status: 500 });
    }
    return new Response('An unknown error occurred', { status: 500 });
  }
};