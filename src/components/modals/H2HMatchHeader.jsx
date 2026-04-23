import { Box, Stack, Typography } from '@mui/material';
import { CalendarToday, LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

// Stacked CSS gradients: two soft radial glows (one per team side) over a deep slate base.
// This gives a "spotlight on each team" feel without needing any image.
const HEADER_BG = [
  'radial-gradient(ellipse 45% 70% at 15% 55%, rgba(99,102,241,0.22) 0%, transparent 70%)',
  'radial-gradient(ellipse 45% 70% at 85% 55%, rgba(168,85,247,0.18) 0%, transparent 70%)',
  'linear-gradient(160deg, #0d1117 0%, #161b22 55%, #0d1117 100%)',
].join(', ');

export default function H2HMatchHeader({ teamHome, teamAway, nextMatch }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 210, sm: 250 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: HEADER_BG,
      }}
    >
      {/* Subtle top highlight line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        }}
      />

      <Box sx={{ px: { xs: 2, sm: 4 }, pt: { xs: 2.5, sm: 3.5 }, pb: { xs: 3.5, sm: 4.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Home team */}
          <Stack alignItems="center" spacing={1.25} sx={{ flex: 1 }}>
            <Box
              sx={{
                width: { xs: 64, sm: 92 },
                height: { xs: 64, sm: 92 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                p: 1.25,
              }}
            >
              <Box
                component="img"
                src={teamHome?.logo}
                alt={teamHome?.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
              />
            </Box>
            <Typography
              fontWeight={700}
              textAlign="center"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: { xs: '0.82rem', sm: '0.95rem' },
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                maxWidth: 130,
                lineHeight: 1.3,
              }}
            >
              {teamHome?.name}
            </Typography>
          </Stack>

          {/* VS badge */}
          <Box
            sx={{
              px: { xs: 1.75, sm: 2.5 },
              py: { xs: 0.75, sm: 1.25 },
              borderRadius: '50px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 20px rgba(99,102,241,0.2)',
            }}
          >
            <Typography
              fontWeight={900}
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: { xs: '1rem', sm: '1.4rem' },
                letterSpacing: { xs: 2, sm: 3 },
              }}
            >
              VS
            </Typography>
          </Box>

          {/* Away team */}
          <Stack alignItems="center" spacing={1.25} sx={{ flex: 1 }}>
            <Box
              sx={{
                width: { xs: 64, sm: 92 },
                height: { xs: 64, sm: 92 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                p: 1.25,
              }}
            >
              <Box
                component="img"
                src={teamAway?.logo}
                alt={teamAway?.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
              />
            </Box>
            <Typography
              fontWeight={700}
              textAlign="center"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: { xs: '0.82rem', sm: '0.95rem' },
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                maxWidth: 130,
                lineHeight: 1.3,
              }}
            >
              {teamAway?.name}
            </Typography>
          </Stack>
        </Stack>

        {nextMatch && (
          <Box
            sx={{
              mt: { xs: 2.5, sm: 3 },
              px: { xs: 2, sm: 3 },
              py: { xs: 1.25, sm: 1.75 },
              borderRadius: 2,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                letterSpacing: 2.5,
                fontSize: '0.62rem',
                display: 'block',
                mb: 0.75,
              }}
            >
              {t('h2h.nextMatch')}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="center"
              spacing={{ xs: 0.5, sm: 2.5 }}
              alignItems="center"
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <CalendarToday sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.82)', textTransform: 'capitalize', fontWeight: 500 }}
                >
                  {new Date(nextMatch.fixture.date).toLocaleDateString('es-MX', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <LocationOn sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
                  {nextMatch.fixture.venue.name}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

H2HMatchHeader.propTypes = {
  teamHome: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  nextMatch: PropTypes.object,
};
