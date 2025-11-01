export const translate = {
    "reset": {
        "ENG": "Reset",
        "ESP": "Limpiar",
        "BR": "Limpar"
    },
    "start": {
        "ENG": "Start:",
        "ESP": "Inicio:",
        "BR": "Início:"
    },
    "special": {
        "ENG": "Special:",
        "ESP": "Especial:",
        "BR": "Especial:"
    },
    "active": {
        "ENG": "Active:",
        "ESP": "Activo:",
        "BR": "Ativo:"
    },
    "inactive":{
        "ENG": "Inactive:",
        "ESP": "Inactivo:",
        "BR": "Inativo:"
    },
    "points": {
        "ENG": "Points:",
        "ESP": "Puntos:",
        "BR": "Pontos:"
    },
    "talents_used": {
        "ENG": "Bonuses Unlocked",
        "ESP": "Bonus Desbloqueados",
        "BR": "Bônus Desbloqueados"
    },
    "stats": {
        "ENG": "Statistics",
        "ESP": "Estadísticas",
        "BR": "Estatísticas"
    },
    "insufficients_points": {
        "ENG": "Not enough points to unlock this talent",
        "ESP": "No tienes suficientes puntos para desbloquear este talento",
        "BR": "Você não tem pontos suficientes para desbloquear este talento"
    },
    "talent_locked": {
        "ENG": "Cannot unlock this talent",
        "ESP": "No puedes desbloquear este talento",
        "BR": "Você não pode desbloquear este talento"
    },
    "dependent_talents_locked": {
        "ENG": "You must remove all dependent talents first",
        "ESP": "Debes remover primero todos los talentos dependientes",
        "BR": "Você deve remover todos os talentos dependentes primeiro"
    },
    "special_locked": {
        "ENG": "You must unlock {0} talents points in this tree first",
        "ESP": "Primero debes desbloquear {0} puntos de talento de este árbol",
        "BR": "Primeiro você deve desbloquear {0} pontos de talento nesta árvore"
    },
    "empty_tree": {
        "ENG": "You have no active talents",
        "ESP": "No tienes talentos activos",
        "BR": "Você não tem talentos ativos"
    }
}


export function getTranslation(key, lang) {
    return translate[key][lang];
}