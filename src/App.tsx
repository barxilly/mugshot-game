import './App.css'
import axios from 'axios'


async function translateText(text: string, targetLanguage: string) {
  const apiKey = "GCLOUD_API_KEY"
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
    }),
  })

  const data = await response.json()
  console.log("Translated " + text + " to " + data.data.translations[0].translatedText)
  return data.data.translations[0].translatedText
}

let loaded = false

function App() {
  return (
    <>
      <h3 id="accuracy">Accuracy: 0%</h3>
      <div id='game-container'>
        <button id="starter-button" onClick={startGame}>Start Game</button>
      </div>
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png" onLoad={pageLoaded} no-cache="true" alt="1x1" />
      <sub>Images and data from Interpol and FBI</sub>
    </>
  )
}

function pageLoaded() {
  console.log('Page loaded')
  loaded = true

  const attempts = localStorage.getItem('attempts')
  if (!attempts) {
    return
  } else {
    const attemptsList = JSON.parse(attempts)
    const correct = attemptsList.filter((a: number) => a === 1).length
    const total = attemptsList.length
    const accuracy = (correct / total) * 100
    const accuracyElement = document.getElementById('accuracy')
    if (accuracyElement) {
      accuracyElement.innerHTML = `Accuracy: ${accuracy.toFixed(2)}%`
    }
  }
}

async function startGame() {
  if (!loaded) return;
  console.log('Starting game')
  const url = `https://ws-public.interpol.int/notices/v1/${Math.random() < 0.5 ? 'red' : 'yellow'}?resultPerPage=160&page=`;
  const url2 = `https://api.fbi.gov/wanted/v1/list?page=`
  const container = document.getElementById('game-container')
  if (!container) return;
  container.innerHTML = '<h2 id="objective">Does this image match the case?</h2><div id="mugshot-container"></div><div id="crime-container"></div><div id="match-container"></div>'
  if (Math.random() < 0.5) {
    let page = Math.floor(Math.random() * 1000)
    const response = await axios.get(url + page)
    const data = response.data
    const notices = data._embedded.notices
    const notice = notices[Math.floor(Math.random() * notices.length)]
    const mugshot = document.createElement('img')
    if (!notice._links.thumbnail) {
      startGame()
      return
    }
    mugshot.src = notice._links.thumbnail.href
    mugshot.alt = notice.crime
    mugshot.className = 'mugshot'
    container.querySelector('#mugshot-container')!.appendChild(mugshot)
    const pageresponse = await axios.get(notice._links.self.href)
    console.log(pageresponse.data)
    if (!pageresponse.data.arrest_warrants) {
      startGame()
      return
    }
    if (Math.random() < 0.5) {
      let crime = pageresponse.data.arrest_warrants[0].charge
      crime = await translateText(crime, 'en')
      container.querySelector('#crime-container')!.innerHTML = `${crime}`
      let tr = document.createElement('span')
      tr.innerHTML = 'r'
      tr.id = 'tr'
      tr.style.display = 'none'
      container.querySelector('#mugshot-container')!.appendChild(tr)
    } else {
      const rnotice = notices[Math.floor(Math.random() * notices.length)]
      const rnoticepageresponse = await axios.get(rnotice._links.self.href)
      if (!rnoticepageresponse.data.arrest_warrants) {
        startGame()
        return
      }
      let rcrime = rnoticepageresponse.data.arrest_warrants[0].charge
      rcrime = await translateText(rcrime, 'en')
      container.querySelector('#crime-container')!.innerHTML = `${rcrime}`
      let tr = document.createElement('span')
      tr.innerHTML = pageresponse.data.arrest_warrants[0].charge
      tr.id = 'tr'
      tr.style.display = 'none'
      container.querySelector('#mugshot-container')!.appendChild(tr)
    }
  } else {
    const response = await axios.get(url2 + Math.floor(Math.random() * 50))
    const data = response.data
    const wanted = data.items
    const person = wanted[Math.floor(Math.random() * wanted.length)]
    console.log(person)
    const mugshot = document.createElement('img')
    if (!person.images) {
      startGame()
      return
    }
    mugshot.src = person.images[0].thumb
    mugshot.alt = person.title
    container.querySelector('#mugshot-container')!.appendChild(mugshot)
    if (Math.random() < 0.5) {
      // Crime should be person.details, person.description, or person.caution, whichever is longest
      let crime = person.caution || person.details || person.description
      if (person.details && person.details.length > crime.length) {
        crime = person.details
      }
      if (person.caution && person.caution.length > crime.length) {
        crime = person.caution
      }
      if (person.description && person.description.length > crime.length) {
        crime = person.description
      }
      container.querySelector('#crime-container')!.innerHTML = `${crime}`
      let tr = document.createElement('span')
      tr.innerHTML = 'r'
      tr.id = 'tr'
      tr.style.display = 'none'
      container.querySelector('#mugshot-container')!.appendChild(tr)
    } else {
      const rperson = wanted[Math.floor(Math.random() * wanted.length)]
      let rcrime = rperson.caution || rperson.details || rperson.description
      if (rperson.details && rperson.details.length > rcrime.length) {
        rcrime = rperson.details
      }
      if (rperson.caution && rperson.caution.length > rcrime.length) {
        rcrime = rperson.caution
      }
      if (rperson.description && rperson.description.length > rcrime.length) {
        rcrime = rperson.description
      }
      container.querySelector('#crime-container')!.innerHTML = `${rcrime}`
      let tr = document.createElement('span')
      tr.innerHTML = person.caution || person.details || person.description
      tr.id = 'tr'
      tr.style.display = 'none'
      container.querySelector('#mugshot-container')!.appendChild(tr)
    }
  }
  const button = document.createElement('button')
  button.innerHTML = 'Match'
  button.className = 'match-button'
  button.addEventListener('click', match)
  container.querySelector('#match-container')!.appendChild(button)
  const button2 = document.createElement('button')
  button2.innerHTML = 'No Match'
  button2.className = 'no-match-button'
  button2.addEventListener('click', noMatch)
  container.querySelector('#match-container')!.appendChild(button2)
}

function match() {
  console.log('Match')
  const container = document.getElementById('game-container')
  if (!container) return;
  const tr = container.querySelector('#tr')
  if (!tr) return;
  let bool;
  if (tr.innerHTML === "r") {
    alert('Correct!')
    bool = 1
  } else {
    alert('Incorrect!')
    bool = 0
  }

  let attempts = localStorage.getItem('attempts')
  if (!attempts) {
    localStorage.setItem('attempts', JSON.stringify([bool]))
  } else {
    const attemptsList = JSON.parse(attempts)
    attemptsList.push(bool)
    localStorage.setItem('attempts', JSON.stringify(attemptsList))
  }

  attempts = localStorage.getItem('attempts')
  if (!attempts) {
    return
  } else {
    const attemptsList = JSON.parse(attempts)
    const correct = attemptsList.filter((a: number) => a === 1).length
    const total = attemptsList.length
    const accuracy = (correct / total) * 100
    const accuracyElement = document.getElementById('accuracy')
    if (accuracyElement) {
      accuracyElement.innerHTML = `Accuracy: ${accuracy.toFixed(2)}%`
    }
  }

  startGame()
}

function noMatch() {
  const container = document.getElementById('game-container')
  if (!container) return;
  const tr = container.querySelector('#tr')
  if (!tr) return;
  let bool;
  if (tr.innerHTML === "r") {
    alert('Incorrect!')
    bool = 0
  } else {
    alert('Correct!')
    bool = 1
  }

  let attempts = localStorage.getItem('attempts')
  if (!attempts) {
    localStorage.setItem('attempts', JSON.stringify([bool]))
  } else {
    const attemptsList = JSON.parse(attempts)
    attemptsList.push(bool)
    localStorage.setItem('attempts', JSON.stringify(attemptsList))
  }

  attempts = localStorage.getItem('attempts')
  if (!attempts) {
    return
  } else {
    const attemptsList = JSON.parse(attempts)
    const correct = attemptsList.filter((a: number) => a === 1).length
    const total = attemptsList.length
    const accuracy = (correct / total) * 100
    const accuracyElement = document.getElementById('accuracy')
    if (accuracyElement) {
      accuracyElement.innerHTML = `Accuracy: ${accuracy.toFixed(2)}%`
    }
  }

  startGame()
}
export default App