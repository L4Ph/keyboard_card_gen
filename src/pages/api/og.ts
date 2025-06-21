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
    params.text = text;
  } else {
    params.subset = "latin";
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

    const fontText = [keyboardName, owner, switches, keycaps, layout, description, 'Switches: ', 'Keycaps: ', 'Layout: '].filter(Boolean).join('');
    const plexSansJPRegular = await loadGoogleFont({ family: 'IBM Plex Sans JP', weight: 400, text: fontText });
    const plexSansJPBold = await loadGoogleFont({ family: 'IBM Plex Sans JP', weight: 700, text: fontText });

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
          color: '#374151',
        },
        children: [
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
                opacity: '0.4',
                zIndex: -1,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '20px',
                backgroundColor: colorScheme.primary,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '100%',
                height: '20px',
                backgroundColor: colorScheme.primary,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                zIndex: 0,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                height: '100%',
                zIndex: 1,
              },
              children: [
                // Left side
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '50%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '80px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            width: '100%',
                            fontSize: '48px',
                            marginBottom: '20px',
                          },
                          children: [
                            (switches && switches.trim() !== '') && {
                              type: 'div',
                              props: {
                                style: { display: 'flex', marginBottom: '10px' },
                                children: [
                                  { type: 'span', props: { children: 'Switches: ' } },
                                  { type: 'span', props: { style: { fontWeight: 'bold' }, children: switches } }
                                ]
                              }
                            },
                            (keycaps && keycaps.trim() !== '') && {
                              type: 'div',
                              props: {
                                style: { display: 'flex', marginBottom: '10px' },
                                children: [
                                  { type: 'span', props: { children: 'Keycaps: ' } },
                                  { type: 'span', props: { style: { fontWeight: 'bold' }, children: keycaps } }
                                ]
                              }
                            },
                            (layout && layout.trim() !== '') && {
                              type: 'div',
                              props: {
                                style: { display: 'flex', marginBottom: '10px' },
                                children: [
                                  { type: 'span', props: { children: 'Layout: ' } },
                                  { type: 'span', props: { style: { fontWeight: 'bold' }, children: layout } }
                                ]
                              }
                            },
                          ].filter(Boolean)
                        }
                      },
                      (description && description.trim() !== '') && {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '36px',
                            color: '#6b7280',
                            textAlign: 'left',
                            width: '100%',
                          },
                          children: description,
                        }
                      }
                    ].filter(Boolean)
                  }
                },
                // Right side
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '50%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '80px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '80px',
                            fontWeight: 'bold',
                            color: colorScheme.primary,
                            marginBottom: '20px',
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
                            marginBottom: '40px',
                          },
                          children: owner,
                        }
                      },
                    ].filter(Boolean)
                  }
                }
              ]
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