import './style.css';
import TomSelect from 'tom-select';
import { Notification } from './scripts/notification';
import Inputmask from 'inputmask';
import JustValidate from 'just-validate';

const bookingomediansList = document.querySelector('.booking__comedians-list');
const bokkingForm = document.querySelector('.booking__form');
const bookingInputFullname = document.querySelector('.booking__input_fullname')
const bookingInputPhone = document.querySelector('.booking__input_phone');
const bookingInputTicket = document.querySelector('.booking__input_ticket');

const MAX_COMEDIANS = 6;

const notification = Notification.getInstance();

new Inputmask('+7(999)999-99-99').mask(bookingInputPhone);
new Inputmask('99999999').mask(bookingInputTicket);

const createComedianBlock = (comedians) => {
    const bookingComedian = document.createElement('li');
    const bookingSelectComedian = document.createElement('select');
    const bookingSelectTime = document.createElement('select');
    const inputHidden = document.createElement('input');
    const bookingHall = document.createElement('button');

    bookingComedian.classList.add('booking__comedian');
    bookingSelectComedian.classList.add('booking__select', 'booking__select_comedian');
    bookingSelectTime.classList.add('booking__select', 'booking__select_time');
    inputHidden.type = 'hidden';
    inputHidden.name = 'booking';
    bookingHall.classList.add('booking__hall');
    bookingHall.type = 'button';

    bookingComedian.append(bookingSelectComedian, bookingSelectTime, inputHidden);

    const bookingTomSelectComedian = new TomSelect(bookingSelectComedian, {
        hideSelected: true,
        placeholder: 'Выбрать комика',
        options: comedians.map(item => ({
            value: item.id,
            text: item.comedian
        }))
    });

    const bookingTomSelectTime = new TomSelect(bookingSelectTime, {
        hideSelected: true,
        placeholder: 'Выбрать время',
    });
    bookingTomSelectTime.disable();

    bookingTomSelectComedian.on('change', (id) => {
        bookingTomSelectComedian.blur();
        bookingTomSelectTime.enable();

        const { performances } = comedians.find(item => item.id === id);

        bookingTomSelectTime.clear();
        bookingTomSelectTime.clearOptions();
        bookingTomSelectTime.addOptions(
            performances.map((item) => ({
                value: item.time,
                text: item.time
            }))
        );

        bookingHall.remove()
    });

    bookingTomSelectTime.on('change', (time) => {
        if (!time) {
            return;
        };

        const idComedian = bookingTomSelectComedian.getValue();
        const { performances } = comedians.find(item => item.id === idComedian);
        const { hall } = performances.find(item => item.time === time);

        inputHidden.value = `${idComedian},${time}`;

        bookingTomSelectTime.blur();
        bookingHall.textContent = hall;
        bookingComedian.append(bookingHall);
    });

    const createNextBookingComedian = () => {
        if (bookingomediansList.children.length < MAX_COMEDIANS) {
            const nextComedianBlock = createComedianBlock(comedians);

            bookingomediansList.append(nextComedianBlock);
        };

        bookingTomSelectTime.off('change', createNextBookingComedian);
    };

    bookingTomSelectTime.on('change', createNextBookingComedian);

    return bookingComedian
};

const getComedians = async () => {
    const response = await fetch('http://localhost:8080/comedians');

    return response.json()
};

const init = async () => {
    const countComedians = document.querySelector('.event__info-item_comedians .event__info-number')
    const comedians = await getComedians();

    countComedians.textContent = comedians.length

    const comedianBlock = createComedianBlock(comedians);

    bookingomediansList.append(comedianBlock);

    const validate = new JustValidate(bokkingForm, {
        errorFieldCssClass: 'booking__input_invalid',
        successFieldCssClass: 'booking__input_valid',
    });

    validate
        .addField(bookingInputFullname, [
            {
                rule: 'required',
                errorMessage: 'Заполните Имя'
            },
        ])
        .addField(bookingInputPhone, [
            {
                rule: 'required',
                errorMessage: 'Заполните Телефон'
            },
            {
                validator() {
                    const phone = bookingInputPhone.inputmask.unmaskedvalue();

                    return phone.length === 10 && !!Number(phone)

                },
                errorMessage: 'Некорректный телефон'
            }
        ])
        .addField(bookingInputTicket, [
            {
                rule: 'required',
                errorMessage: 'Заполните Номер билета'
            },
            {
                validator() {
                    const ticket = bookingInputTicket.inputmask.unmaskedvalue();

                    return ticket.length === 8 && !!Number(ticket)
                },
                errorMessage: 'Неверный номер билета'
            },
        ]).onFail((fields) => {
            let errorMessage = '';

            for (const key in fields) {
                if (!Object.hasOwnProperty.call(fields, key)) {
                    continue;
                };

                const elem = fields[key];

                if (!elem.isValid) {
                    errorMessage += `${elem.errorMessage}, `;
                }
            };

            notification.show(errorMessage.slice(0, -2), false);
        });

    bokkingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = { booking: [] };
        const times = new Set();

        new FormData(bokkingForm).forEach((value, field) => {
            if (field === 'booking') {
                const [comedian, time] = value.split(',');

                if (comedian && time) {
                    data.booking.push({ comedian, time });
                    times.add(time);
                };

            } else {
                data[field] = value;
            };

            if (times.size !== data.booking.length) {
                notification.show('Нельзя быть в одно время на двух выступлениях');
            };
        });
    });
};

init();