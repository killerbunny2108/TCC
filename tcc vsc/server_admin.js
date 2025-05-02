const dicasRoutes = require('./routes/dicas'); // caminho conforme estrutura
app.use(express.json());
app.use(cors());
app.use(dicasRoutes);