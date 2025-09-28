import React from 'react';
import OrderForm from '../components/OrderForm';

const OrderPage = () => {
  const handleOrderSubmit = (orderData) => {
    console.log('Order submitted:', orderData);
    alert(`Order submitted successfully!\nOrder Number: ${orderData.grubhubOrderNumber}\nRestaurant: ${orderData.restaurant}\nDorm: ${orderData.dorm}\nRoom: ${orderData.roomNumber}\nEmail: ${orderData.email}`);
  };

  return (
    <>
      <header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: '#b91c1c', fontWeight: 'bold', fontSize: '24px'}}>C</span>
          </div>
          <h1 style={{margin: 0, fontSize: '28px', fontWeight: 'bold'}}>CMU Compete</h1>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "30px auto", padding: "0 20px" }}>
        <OrderForm onSubmit={handleOrderSubmit} />
      </main>
    </>
  );
};

export default OrderPage;
