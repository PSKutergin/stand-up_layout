import './style.css';
import TomSelect from 'tom-select';

const bookingomediansList = document.querySelector('.booking__comedians-list');

const MAX_COMEDIANS = 6;

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
};

init();