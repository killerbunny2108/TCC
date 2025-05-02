const dicasRoutes = require('./routes/dica'); // caminho conforme estrutura
app.use(express.json());
app.use(cors());
app.use(dicasRoutes);