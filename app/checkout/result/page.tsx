export default async function CheckoutResultPage({ searchParams }: { searchParams: Promise<{ id?: string, status?: string }> }) {
  const { id, status } = await searchParams;

  const isApproved = status === 'APPROVED';

  return (
    <div className="max-w-2xl mx-auto mt-20 bg-white p-10 rounded-xl shadow border text-center">
      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isApproved ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
        {isApproved ? (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        ) : (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        )}
      </div>
      
      <h1 className="text-3xl font-bold mt-6 text-gray-900">
        {isApproved ? '¡Pago Exitoso!' : 'Pago Rechazado o Fallido'}
      </h1>
      
      <p className="mt-4 text-gray-600">
        {isApproved 
          ? 'Hemos recibido tu pago y estamos procesando tu orden. Te llegará un correo con los detalles de tu compra en WompiStore.' 
          : 'Hubo un problema procesando tu pago o éste fue rechazado. Revisa el estado de la transacción en Wompi e intenta de nuevo.'}
      </p>

      {id && (
        <div className="mt-8 bg-gray-50 p-4 rounded text-sm text-gray-500 border font-mono tracking-wider shadow-inner">
          Transacción Ref: {id}
        </div>
      )}

      <div className="mt-10">
        <a href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow">
          Volver a la tienda principal
        </a>
      </div>
    </div>
  );
}
