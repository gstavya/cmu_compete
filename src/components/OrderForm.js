import React, { useState } from 'react';
import { auth } from '../firebase';

const OrderForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    grubhubOrderNumber: '',
    restaurant: '',
    dorm: '',
    roomNumber: ''
  });
  const [errors, setErrors] = useState({});

  const restaurants = [
    'Hunan Express',
    'Au Bon Pain', 
    'Nourish',
    'Scotty\'s Market',
    'Stack\'d Underground',
    'Capital Grains',
    'Millie\'s Coffee \'N\' Creamery',
    'El Gallo de Oro',
    'E.A.T.',
    'Tahini',
    'Ola Ola',
    'Taste of India',
    'The Edge',
    'Tepper Taqueria',
    'Manna',
    'Forbes Ave Subs',
    'Wild Blue Sushi',
    'Crisp and Crust Express',
    'Tartan Express',
    'Fire & Stone',
    'Kebab Grill',
    'Crisp and Crust',
    'Sweet Plantain',
    'Redhawk Coffee',
    'The Exchange',
    'De Fer Coffee and Tea',
    'New York Bagel Bar at Zebra Lounge'
  ];

  const dorms = [
    'Boss House',
    'McGill House'
  ];

  const validateForm = () => {
    const newErrors = {};

    // Validate Grubhub order number (digits only)
    if (!formData.grubhubOrderNumber) {
      newErrors.grubhubOrderNumber = 'Grubhub order number is required';
    } else if (!/^\d+$/.test(formData.grubhubOrderNumber)) {
      newErrors.grubhubOrderNumber = 'Order number must contain only digits';
    }

    // Validate restaurant selection
    if (!formData.restaurant) {
      newErrors.restaurant = 'Please select a restaurant';
    }

    // Validate dorm selection
    if (!formData.dorm) {
      newErrors.dorm = 'Please select a dorm';
    }

    // Validate room number (3 digits, first digit 1-3)
    if (!formData.roomNumber) {
      newErrors.roomNumber = 'Room number is required';
    } else if (!/^[1-3]\d{2}$/.test(formData.roomNumber)) {
      newErrors.roomNumber = 'Room number must be 3 digits with first digit 1-3';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for Grubhub order number - only allow digits
    if (name === 'grubhubOrderNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    }
    // Special handling for room number - only allow digits and limit to 3 digits
    else if (name === 'roomNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const orderData = {
        ...formData,
        email: auth.currentUser?.email, // Use Google sign-in email
        userId: auth.currentUser?.uid,
        submittedAt: new Date().toISOString()
      };
      
      onSubmit && onSubmit(orderData);
      
      // Reset form after successful submission
      setFormData({
        grubhubOrderNumber: '',
        restaurant: '',
        dorm: '',
        roomNumber: ''
      });
      setErrors({});
    }
  };

  return (
    <div className="cmu-card">
      <h2 style={{ color: '#b91c1c', marginBottom: '20px', fontSize: '24px' }}>
        Food Delivery Order Form
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Grubhub Order Number */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Grubhub Order Number *
          </label>
          <input
            type="text"
            name="grubhubOrderNumber"
            value={formData.grubhubOrderNumber}
            onChange={handleInputChange}
            placeholder="Enter order number (digits only)"
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.grubhubOrderNumber ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          />
          {errors.grubhubOrderNumber && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px', marginBottom: '0' }}>
              {errors.grubhubOrderNumber}
            </p>
          )}
        </div>

        {/* Restaurant Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Restaurant *
          </label>
          <select
            name="restaurant"
            value={formData.restaurant}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.restaurant ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select a restaurant</option>
            {restaurants.map(restaurant => (
              <option key={restaurant} value={restaurant}>
                {restaurant}
              </option>
            ))}
          </select>
          {errors.restaurant && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px', marginBottom: '0' }}>
              {errors.restaurant}
            </p>
          )}
        </div>

        {/* Dorm Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Dorm *
          </label>
          <select
            name="dorm"
            value={formData.dorm}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.dorm ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select a dorm</option>
            {dorms.map(dorm => (
              <option key={dorm} value={dorm}>
                {dorm}
              </option>
            ))}
          </select>
          {errors.dorm && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px', marginBottom: '0' }}>
              {errors.dorm}
            </p>
          )}
        </div>

        {/* Room Number */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Room Number *
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleInputChange}
            placeholder="Enter 3-digit room number (first digit 1-3)"
            maxLength="3"
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.roomNumber ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          />
          {errors.roomNumber && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px', marginBottom: '0' }}>
              {errors.roomNumber}
            </p>
          )}
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px', marginBottom: '0' }}>
            Must be 3 digits with first digit between 1-3 (e.g., 101, 205, 312)
          </p>
        </div>

        {/* Email Display (Read-only) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Email Address
          </label>
          <input
            type="email"
            value={auth.currentUser?.email || 'Not signed in'}
            disabled
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#f9fafb',
              color: '#6b7280'
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px', marginBottom: '0' }}>
            Using your Google sign-in email address
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            backgroundColor: '#b91c1c',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            marginTop: '10px',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#991b1b';
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#b91c1c';
            e.target.style.transform = 'scale(1)';
          }}
        >
          Submit Order
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
