import { useState } from 'react'
import './App.css'
import { Box, Button, Typography  } from '@mui/material/Button';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Box>
      <Typography>Material-UI</Typography>
      <Button variant="contained">Hello World</Button>
    </Box>
  )
}

export default App
