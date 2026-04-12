// Utility functions for comparing match objects and defining PropTypes for match data
import PropTypes from 'prop-types';

export const areRowsEqual = (prevProps, nextProps) => {
  const prev = prevProps.match;
  const next = nextProps.match;
  return (
    prev.goals.home === next.goals.home &&
    prev.goals.away === next.goals.away &&
    prev.fixture.status.elapsed === next.fixture.status.elapsed &&
    prev.fixture.id === next.fixture.id
  );
};

// PropTypes shared between desktop and mobile views for match objects
export const matchPropTypes = PropTypes.shape({
  fixture: PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.shape({
      elapsed: PropTypes.number,
    }).isRequired,
    venue: PropTypes.shape({
      name: PropTypes.string,
    }).isRequired,
  }).isRequired,
  league: PropTypes.shape({
    logo: PropTypes.string,
    name: PropTypes.string.isRequired,
  }).isRequired,
  teams: PropTypes.shape({
    home: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      logo: PropTypes.string.isRequired,
    }).isRequired,
    away: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      logo: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  goals: PropTypes.shape({
    home: PropTypes.number,
    away: PropTypes.number,
  }).isRequired,
}).isRequired;