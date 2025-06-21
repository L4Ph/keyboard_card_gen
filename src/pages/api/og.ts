import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const colorSchemes = {
  blue: { primary: '#3b82f6', secondary: '#1e40af', accent: '#dbeafe' },
  purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ede9fe' },
  orange: { primary: '#f97316', secondary: '#ea580c', accent: '#fed7aa' },
  green: { primary: '#10b981', secondary: '#059669', accent: '#d1fae5' },
  red: { primary: '#ef4444', secondary: '#dc2626', accent: '#fecaca' }
};

async function getFontData(fontPath: string): Promise<ArrayBuffer> {
  const absolutePath = path.join(process.cwd(), fontPath);
  const buffer = await fs.readFile(absolutePath);
  // Convert Buffer to ArrayBuffer
  return Uint8Array.from(buffer).buffer;
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

    const plexSansJPRegular = await getFontData('public/fonts/IBMPlexSansJP-Regular.ttf');
    const plexSansJPBold = await getFontData('public/fonts/IBMPlexSansJP-Bold.ttf');

    const html = {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"Inter"',
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
          photoDataUrl && {
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
                opacity: '0.3',
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
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 0,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '80px',
                paddingTop: '80px',
                textAlign: 'center',
                zIndex: 1,
                height: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '72px',
                      fontWeight: 'bold',
                      color: colorScheme.primary,
                      marginBottom: '20px',
                    },
                    children: keyboardName,
                  }
                },
                owner && {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '56px',
                      fontWeight: 'bold',
                      color: colorScheme.secondary,
                      marginBottom: '40px',
                    },
                    children: owner,
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      fontSize: '36px',
                      marginBottom: '20px',
                      padding: '0 80px',
                    },
                    children: [
                      switches && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', marginBottom: '10px' },
                          children: [
                            { type: 'span', props: { children: 'Switches: ' } },
                            { type: 'span', props: { style: { fontWeight: 'bold' }, children: switches } }
                          ]
                        }
                      },
                      keycaps && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', marginBottom: '10px' },
                          children: [
                            { type: 'span', props: { children: 'Keycaps: ' } },
                            { type: 'span', props: { style: { fontWeight: 'bold' }, children: keycaps } }
                          ]
                        }
                      },
                      layout && {
                        type: 'div',
                        props: {
                          style: { display: 'flex', marginBottom: '10px' },
                          children: [
                            { type: 'span', props: { children: 'Layout: ' } },
                            { type: 'span', props: { style: { fontWeight: 'bold' }, children: layout } }
                          ]
                        }
                      },
                    ]
                  }
                },
                description && {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      color: '#6b7280',
                      textAlign: 'left',
                      padding: '0 80px',
                      width: '100%',
                    },
                    children: description,
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

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1748,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

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