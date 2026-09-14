const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  usuario:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  item:     { type: String, required: true, trim: true },   // ¿Qué compraste?
  cantidad: { type: Number, required: true, min: 1 },
  valor:    { type: Number, required: true, min: 0 },       // valor unitario
  fecha:    { type: Date, default: Date.now }               // automática
});

// Total calculado (no se guarda, se calcula al vuelo)
purchaseSchema.virtual('total').get(function () {
  return this.cantidad * this.valor;
});
purchaseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
