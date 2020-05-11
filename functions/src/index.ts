import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

admin.initializeApp(functions.config().firebase);

const app = express();
const main = express();

main.use('/api/v1', app);
main.use(express.json());

const db = admin.firestore();
const barCollection = 'bars';
const countryCollection = 'countries';

export const webApi = functions.https.onRequest(main);

interface Bar {
  name: string,
  streetAddress: string,
  city: string,
  country: string,
  stateOrProvince?: string
  url?: string,
  imgUrl?: string,
  permanentlyClosed?: boolean
}

interface Country {
  name: string,
  territoryType: string,
  shortName?: string
}

app.post('/bars', async (req, res) => {
  try {
    const { name, streetAddress, city, country, url, imgUrl, permanentlyClosed, stateOrProvince } = req.body;
    const bar: Bar = {
      name,
      streetAddress,
      city,
      country,
      stateOrProvince: stateOrProvince || null,
      url: url || null,
      imgUrl: imgUrl || null,
      permanentlyClosed: permanentlyClosed || false,
    }
    const newDoc = await db.collection(barCollection).add(bar);
    res.status(201).send(`Created a new bar: ${newDoc.id}`);
  } catch (error) {
    res.status(400).send(`Failed to create a new bar`)
  }
});

app.put('/bars/:barId', async (req, res) => {
  try {
    const barId = req.params.barId;
    const barData = req.body;
    await db.collection(barCollection)
      .doc(barId)
      .update(barData);

    res.status(201).send(`Successfully updated bar`);
  } catch (error) {
    res.status(400).send(`Failed to update bar`)
  }
});


app.post('/countries', async (req, res) => {
  try {
    const { name, territoryType, shortName } = req.body;
    const country: Country = {
      name,
      territoryType,
      ...shortName && { shortName }
    }
    await db.collection(countryCollection).doc(name).set(country);
    res.status(201).send(`Added a new country`);
  } catch (error) {
    res.status(400).send(`Failed to set new country`)
  }
});

app.get('/bars', async (req, res) => {
  try {
    const barsQuerySnapshot = await db.collection(barCollection).get();
    const bars: any[] = [];
    barsQuerySnapshot.forEach(
      (doc) => {
        bars.push({
          id: doc.id,
          ...doc.data()
        });
      }
    );
    res.status(200).json(bars);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/bars/:barId', async (req, res) => {
  try {
    const barId = req.params.barId;
    if (!barId) throw new Error('Bar ID is required');

    const bar = await db.collection(barCollection).doc(barId).get();

    if (!bar.exists) {
      throw new Error('No bar found');
    }
    res.json({
      id: bar.id,
      ...bar.data()
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/bars/:barId', async (req, res) => {
  try {
    const barId = req.params.barId;
    await db.collection(barCollection).doc(barId).delete();
    res.status(200).send('Bar successfully deleted');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/countries', async (req, res) => {
  try {
    const countriesQuerySnapshot = await db.collection(countryCollection).get();
    const countries: any[] = [];
    countriesQuerySnapshot.forEach(
      (doc) => {
        countries.push({
          id: doc.id,
          ...doc.data()
        });
      }
    );
    res.status(200).json(countries);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/countries/:countryId', async (req, res) => {
  try {
    const countryId = req.params.countryId;
    if (!countryId) throw new Error('Country ID is required');

    const country = await db.collection(countryCollection).doc(countryId).get();

    if (!country.exists) {
      throw new Error('No country found');
    }
    res.json({
      id: country.id,
      ...country.data()
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

